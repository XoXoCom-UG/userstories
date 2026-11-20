import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The only place in this app that holds the Supabase SERVICE-ROLE key — the key
 * that bypasses every access rule. `import "server-only"` makes the build fail
 * if a browser bundle ever reaches this file.
 *
 * It exists for one job: redeeming a beta key (and counting attempts at it).
 * Nothing else in this app should import it. If you need it for a second
 * thing, ask whether that belongs behind a route that checks the user's token
 * first — and whether it belongs in AgentiX instead, which already holds the key.
 *
 * Set SUPABASE_SERVICE_ROLE_KEY on the server only: never with a NEXT_PUBLIC_
 * prefix, and in Vercel for Production only — a Preview deployment runs
 * whatever branch someone pushed, with the key in its environment.
 */

/** Without the key, development stays open and production refuses. */
export const FAIL_OPEN = process.env.NODE_ENV !== "production";

let cached: SupabaseClient | null | undefined;

export function admin(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  cached = url && key
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
  return cached;
}

/**
 * One fixed-window count per account and bucket, shared by every instance and
 * by AgentiX (take_rate_slot, the same database function). True while the
 * account is within its allowance. Unreadable → open in development, closed in
 * production: a limit that fails open is not a limit.
 */
export async function takeRateSlot(userId: string, bucket: "redeem", max: number, windowSeconds = 60): Promise<boolean> {
  const db = admin();
  if (!db) return FAIL_OPEN;
  const { data, error } = await db.rpc("take_rate_slot", {
    p_user: userId, p_bucket: bucket, p_window_seconds: windowSeconds, p_max: max,
  });
  if (error) {
    console.error("[rate] could not check:", error.code, error.message);
    return FAIL_OPEN;
  }
  return data === true;
}

/**
 * The same count keyed by a network instead of an account (take_ip_slot). It
 * fails open even in production: an address limit is a second line behind the
 * account limit, and a missing function must not become a reason nobody can
 * sign in. The first failure is logged, not every one.
 */
let ipSlotWarned = false;

export async function takeIpSlot(key: string, bucket: string, max: number, windowSeconds = 60): Promise<boolean> {
  const db = admin();
  if (!db) return true;
  const { data, error } = await db.rpc("take_ip_slot", {
    p_key: key, p_bucket: bucket, p_window_seconds: windowSeconds, p_max: max,
  });
  if (error) {
    if (!ipSlotWarned) {
      ipSlotWarned = true;
      console.error("[rate] address limit unavailable:", error.code, error.message);
    }
    return true;
  }
  return data === true;
}
