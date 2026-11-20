import "server-only";
import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { clientIp, ipKey, WindowCounter } from "@/lib/client-ip";
import { takeIpSlot } from "@/lib/server-db";

/**
 * A limit per network, ahead of everything that costs something — AgentiX's
 * lib/ip-gate.ts, cut down to the one scope this app has. Guessing invitation
 * keys from many accounts at once is the attack an account limit cannot see;
 * this counts the network instead, BEFORE the session is looked up, so a
 * refused request costs nothing.
 *
 * Two counts: this instance's memory (free, stops a flood reaching the
 * database) and take_ip_slot, which every instance shares. Numbers are per
 * network — an office or a mobile carrier is one — so they sit well above what
 * one person does; the account limit is the tight one.
 */

const REDEEM = { max: 25, windowSeconds: 600 } as const;
const counter = new WindowCounter(REDEEM.windowSeconds * 1000, REDEEM.max);

/**
 * Only a keyed hash of the network is ever stored or logged: an address is
 * personal data, and the IPv4 space is small enough to hash by brute force, so
 * the hash is keyed. IP_HASH_SALT if set, otherwise the service-role key.
 */
function hashed(network: string): string {
  const salt = process.env.IP_HASH_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "xoxo-dev";
  return createHmac("sha256", salt).update(network).digest("hex").slice(0, 32);
}

/** Null when the request may go on, otherwise the 429 to send back. */
export async function redeemIpGate(req: Request): Promise<NextResponse | null> {
  const ip = clientIp(req.headers);
  // No usable address (local development): nothing to count, and grouping every
  // such request together would let one lock out the rest.
  if (!ip) return null;

  const key = hashed(ipKey(ip));
  if (!counter.hit(key) || !(await takeIpSlot(key, "redeem", REDEEM.max, REDEEM.windowSeconds))) {
    return NextResponse.json(
      { error: "Too many requests from this network. Wait a few minutes, then try again.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": "300" } },
    );
  }
  return null;
}
