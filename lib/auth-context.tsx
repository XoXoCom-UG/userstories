"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

/**
 * The shared XoXoCom account. Same Supabase project as AgentiX, so one account
 * works in every product — but each product is on its own domain, and cookies
 * do not cross domains, so each one signs you in separately. That is on
 * purpose: a flaw on one domain cannot hand over the session of another.
 *
 * Mirrors AgentiX's lib/auth-context.tsx, without what only AgentiX has (plans,
 * agent levels, per-account browser memory).
 */

interface AuthContextType {
  session: Session | null;
  user: User | null;
  token: string | null;
  loading: boolean;
  profileName: string;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, token: null, loading: true, profileName: "", signOut: async () => {},
});

/**
 * Drops the Supabase auth cookies when the client has decided there is no valid
 * session. proxy.ts only checks that the cookie EXISTS, so one left behind by an
 * expired session makes it wave the visitor in while this provider finds no
 * session — the page then redirects to /login and the proxy sends it back. With
 * the cookie cleared both sides agree again and the login page works.
 */
function clearStaleAuthCookies(): number {
  if (typeof document === "undefined") return 0;
  // Chunked tokens are named `...-auth-token.0`, `.1` — matched by `includes`.
  const names = document.cookie
    .split(";")
    .map(c => c.split("=")[0].trim())
    .filter(n => n.startsWith("sb-") && n.includes("-auth-token"));
  for (const n of names) {
    document.cookie = `${n}=; Max-Age=0; path=/`;
    document.cookie = `${n}=; Max-Age=0; path=/; domain=${location.hostname}`;
  }
  return names.length;
}

/** The same token for the same account, with nothing about the account changed. */
function sameSession(a: Session | null, b: Session | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.access_token === b.access_token
    && a.user?.id === b.user?.id
    && a.user?.updated_at === b.user?.updated_at;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const profileName = (((session?.user?.user_metadata as { full_name?: string } | undefined)?.full_name) ?? "").trim();

  useEffect(() => {
    // Supabase re-announces the session when the tab comes back into view, as a
    // fresh object with the same token; only a real change goes in.
    const take = (s: Session | null) => setSession(prev => (sameSession(prev, s) ? prev : s));

    // Always resolve loading, even on error, so the app never hangs on a blank
    // screen (a corrupt session cookie used to strand it forever).
    supabase.auth.getSession()
      .then(({ data }) => {
        take(data.session);
        if (!data.session) clearStaleAuthCookies();
      })
      .catch(() => { take(null); clearStaleAuthCookies(); })
      .finally(() => setLoading(false));

    // Safety net: if getSession never settles (network stall), stop loading.
    const failsafe = setTimeout(() => setLoading(false), 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      take(s);
      setLoading(false);
      // A refresh token that stops working mid-session leaves the cookie behind.
      if (!s) clearStaleAuthCookies();
    });

    return () => { subscription.unsubscribe(); clearTimeout(failsafe); };
  }, [supabase.auth]);

  // Ends on the login page in a fresh page load, which also drops whatever this
  // tab still holds in memory about the account — matters on a shared computer.
  const signOut = async () => {
    try { await supabase.auth.signOut(); } catch { /* offline: this browser forgets anyway */ }
    clearStaleAuthCookies();
    window.location.replace("/login");
  };

  return (
    <AuthContext.Provider value={{
      session, user: session?.user ?? null, token: session?.access_token ?? null,
      loading, profileName, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
