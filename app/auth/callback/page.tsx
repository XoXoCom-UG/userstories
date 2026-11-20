"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

/**
 * Where the confirmation e-mail lands. The link arrives with a ?code= that has
 * to be exchanged for a session (the browser client does not do it on its own),
 * or with the session already set; hence the short poll at the end.
 *
 * This address must be in Supabase → Authentication → URL Configuration →
 * Redirect URLs for this app's domain, or the link is refused.
 */
export default function AuthCallbackPage() {
  const supabase = createClient();
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let iv: ReturnType<typeof setInterval> | undefined;

    (async () => {
      const { data: s0 } = await supabase.auth.getSession();
      if (s0.session) { router.replace("/"); return; }

      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (!error) { router.replace("/"); return; }
      }

      let tries = 0;
      iv = setInterval(async () => {
        tries++;
        const { data } = await supabase.auth.getSession();
        if (data.session) { clearInterval(iv); router.replace("/"); }
        else if (tries > 12) { clearInterval(iv); setFailed(true); }
      }, 400);
    })();

    return () => { cancelled = true; if (iv) clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="auth">
      <div className="auth-card" role="status">
        {failed ? (
          <>
            <h1>That didn&apos;t work</h1>
            <p className="auth-sub">The link is invalid or has expired. Sign in again to get a fresh one.</p>
            <Link className="btn-go btn-wide" href="/login">Back to sign in</Link>
          </>
        ) : (
          <>
            <h1>Signing you in</h1>
            <p className="auth-sub">One moment, confirming your account.</p>
          </>
        )}
      </div>
    </main>
  );
}
