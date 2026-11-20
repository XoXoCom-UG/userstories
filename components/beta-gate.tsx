"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Tile } from "@/components/app-launcher";
import { XOXO_APPS } from "@/lib/xoxocom-apps";
import { captureBetaKeyFromUrl, clearPendingBetaKey, usePendingBetaKey } from "@/lib/beta-key-handoff";

const SELF = XOXO_APPS.find(a => a.id === "stories")!;

/**
 * The door, while the product is in closed beta. Shown instead of the page to a
 * signed-in account that has not been invited. It is not the security boundary
 * (see lib/beta.ts); it is the part that says why and what to do.
 *
 * The key is the same one AgentiX uses: redeemed in either app, it admits the
 * account in both.
 */
export function BetaGate({ unreadable, onAdmitted }: { unreadable: boolean; onAdmitted: () => void }) {
  const { signOut } = useAuth();
  // What the person typed, or null while they haven't — then the field shows the
  // key from the invitation link, if they came that way.
  const [typed, setTyped] = useState<string | null>(null);
  const invited = usePendingBetaKey();
  const code = typed ?? invited ?? "";
  const fromInvite = typed === null && !!invited;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A tester who is already signed in lands here with the fragment intact.
  useEffect(() => { captureBetaKeyFromUrl(); }, []);

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const { data } = await createClient().auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Your session has expired. Sign in again.");

      const res = await fetch("/api/beta/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: code.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "That didn't work. Try again.");
      clearPendingBetaKey();
      onAdmitted();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // The invitation could not be checked at all: say so and offer a retry, rather
  // than asking for a key the person may already have used.
  if (unreadable) {
    return (
      <main className="auth">
        <div className="auth-card">
          <div className="auth-brand"><Tile app={SELF} size={22} /><span>User Story Schneider</span></div>
          <h1>We couldn&apos;t check your invitation</h1>
          <p className="auth-sub">The connection to the server failed. Nothing is wrong with your account.</p>
          <button className="btn-go btn-wide" type="button" onClick={onAdmitted}>Try again</button>
        </div>
      </main>
    );
  }

  return (
    <main className="auth">
      <div className="auth-card">
        <div className="auth-brand"><Tile app={SELF} size={22} /><span>User Story Schneider</span></div>
        <span className="gate-eyebrow">Closed beta</span>
        <h1>You need a key to come in</h1>
        <p className="auth-sub">
          This app is open to invited testers while we finish it. Enter the key you were given and you
          are in — it only has to be done once, and the same key works in AgentiX.
        </p>
        <form onSubmit={redeem}>
          <div className="field">
            <label htmlFor="beta-key">Your key</label>
            <input id="beta-key" className="key-input" value={code} placeholder="AGXP-XXXXXXXX" autoComplete="off"
              spellCheck={false} autoFocus aria-invalid={!!error || undefined}
              onChange={e => { setTyped(e.target.value.toUpperCase()); setError(null); }} />
            {fromInvite && !error && <p className="field-hint">Filled in from your invitation.</p>}
            {error && <p className="field-err" role="alert">{error}</p>}
          </div>
          <button className="btn-go btn-wide" type="submit" disabled={busy || !code.trim()}>
            {busy ? "Checking…" : "Let me in"}
          </button>
        </form>
        <p className="gate-foot">
          Don&apos;t have one? Write to us and we&apos;ll add you to the next round.{" "}
          <button type="button" className="gate-link" onClick={() => signOut()}>Sign out</button>
        </p>
      </div>
    </main>
  );
}
