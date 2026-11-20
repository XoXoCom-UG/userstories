"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { readAdmission, type Admission } from "@/lib/beta";
import { BetaGate } from "@/components/beta-gate";

/**
 * Wraps every signed-in page while the product is invite-only: one wrapper
 * rather than a check in each screen, so a screen added later inherits the
 * gate instead of being the one that forgot it. Goes inside RequireAuth.
 *
 * While it finds out it draws nothing. Showing the page and then replacing it
 * with the gate reads as the app breaking; showing the gate and then the page
 * tells an invited tester they are not invited.
 */
export function Admitted({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [result, setResult] = useState<{ uid: string; admission: Admission } | null>(null);
  // Bumped to ask again (after redeeming a key, or on Retry).
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    readAdmission(uid)
      .then(admission => { if (alive) setResult({ uid, admission }); })
      .catch(() => { if (alive) setResult({ uid, admission: "error" }); });
    return () => { alive = false; };
  }, [uid, attempt]);

  // A result for another account (signed out, then in as someone else) is not
  // an answer for this one.
  const admission = result && result.uid === uid ? result.admission : null;
  const recheck = () => { setResult(null); setAttempt(a => a + 1); };

  if (admission === null) return <div className="boot" role="status" aria-label="Loading" />;
  if (admission === "yes") return <>{children}</>;
  return <BetaGate unreadable={admission === "error"} onAdmitted={recheck} />;
}
