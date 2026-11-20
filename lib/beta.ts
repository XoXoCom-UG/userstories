import { createClient } from "@/lib/supabase";

/**
 * Closed beta, as in AgentiX: while this is true, an account is let in only
 * after it has redeemed an invitation key. Keep it in step with INVITE_ONLY in
 * AgentiX's lib/plans.ts — they describe the same door, because the account is
 * shared.
 */
export const INVITE_ONLY = true;

export type Admission = "yes" | "no" | "error";

/**
 * Whether this account has been invited. "Invited" is a row in
 * `agxp_entitlements` — the same row AgentiX reads — so someone already admitted
 * there walks straight in here. RLS lets an account read its own row and write
 * none, so the browser can ask without a server and cannot lie to itself.
 *
 * This is the polite half of the gate: it tells the person why and what to do.
 * It is NOT the security boundary — anything that costs money (the AI route,
 * when it exists) must check the same row on the server with the caller's
 * verified token, and refuse when it is missing. A determined person can skip
 * this check with devtools; they cannot skip that one.
 *
 * A failed read is "error", not "no": telling an invited tester they are not
 * invited because the network blinked would be wrong, and letting them in
 * because it blinked would make the gate open exactly when it is unsure.
 */
export async function readAdmission(uid: string): Promise<Admission> {
  if (!INVITE_ONLY) return "yes";
  const { data, error } = await createClient()
    .from("agxp_entitlements")
    .select("plan")
    .eq("user_id", uid)
    .maybeSingle();
  if (error) return "error";
  return data?.plan ? "yes" : "no";
}
