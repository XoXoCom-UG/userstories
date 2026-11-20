import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { redeemIpGate } from "@/lib/ip-gate";
import { admin, takeRateSlot } from "@/lib/server-db";

/**
 * Redeeming a beta key — the same database function AgentiX uses
 * (redeem_beta_key, migration 0009 there), so a key redeemed here admits the
 * account in AgentiX too, and the other way round.
 *
 * A server route rather than a browser call: the key table has no policy at
 * all, so a signed-in user cannot read the list, guess an unused code, or write
 * their own entitlement. All they can do is post a string here and be told yes
 * or no. The redemption is one atomic function, so two people taking the last
 * seat of one key cannot both get in.
 */

/** Verifies the bearer token against Supabase and returns the account it belongs to. */
async function callerId(req: NextRequest): Promise<string | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.getUser(token);
  return error || !data.user ? null : data.user.id;
}

/**
 * A key is a short string someone typed off a message; guessing is the only
 * attack and the keyspace is the defence. A handful of tries a minute costs an
 * attacker nothing, so this costs them a minute: this instance's count first,
 * then take_rate_slot, which every instance shares — ten tries in ten minutes.
 */
const WINDOW_MS = 60_000;
const MAX_TRIES = 8;
const tries = new Map<string, number[]>();

function tooManyTries(userId: string): boolean {
  const now = Date.now();
  const recent = (tries.get(userId) ?? []).filter(t => now - t < WINDOW_MS);
  recent.push(now);
  tries.set(userId, recent);
  if (tries.size > 500) {
    for (const [k, v] of tries) if (!v.some(t => now - t < WINDOW_MS)) tries.delete(k);
  }
  return recent.length > MAX_TRIES;
}

export async function POST(req: NextRequest) {
  // Per network first, before the session is even looked up.
  const crowded = await redeemIpGate(req);
  if (crowded) return crowded;

  const userId = await callerId(req);
  if (!userId) {
    return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
  }
  if (tooManyTries(userId) || !(await takeRateSlot(userId, "redeem", 10, 600))) {
    return NextResponse.json({ error: "Too many attempts. Wait a few minutes and try again." }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as { code?: string } | null;
  const code = (typeof body?.code === "string" ? body.code : "").trim().slice(0, 64);
  if (!code) {
    return NextResponse.json({ error: "Enter the key you were given." }, { status: 400 });
  }

  const db = admin();
  if (!db) {
    // Named in the server log, where the person who can fix it looks.
    console.error("[beta/redeem] SUPABASE_SERVICE_ROLE_KEY is not set");
    return NextResponse.json(
      { error: "Invitations aren't set up on the server yet. Tell us and we'll sort it out." },
      { status: 500 },
    );
  }

  const { data, error } = await db.rpc("redeem_beta_key", { p_user: userId, p_code: code });
  if (error) {
    // P0001 is the function's own refusal, already worded for the person
    // reading it. Anything else is ours to fix: logged, and the user gets a
    // sentence that doesn't blame them.
    if (error.code === "P0001") return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("[beta/redeem] failed:", error.message);
    return NextResponse.json({ error: "Something went wrong on our side. Try again in a moment." }, { status: 500 });
  }
  return NextResponse.json({ plan: data as string });
}
