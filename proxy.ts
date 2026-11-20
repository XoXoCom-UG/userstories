import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection (Next.js 16 "Proxy", formerly Middleware) — the same
 * optimistic check as AgentiX: Supabase keeps the session in a cookie named
 * `sb-<project-ref>-auth-token`; with none, the visitor is surely signed out
 * and goes to /login before the page renders.
 *
 * This is UX only. It cannot tell a valid session from an expired one, and it
 * must not try: AuthProvider (lib/auth-context.tsx) makes the real check and
 * clears a stale cookie. Every API route added later has to verify the bearer
 * token itself — a cookie is not authorization.
 *
 * There is deliberately no "already signed in → leave /login" redirect here:
 * with an expired cookie it loops forever (the proxy sends the visitor in, the
 * client finds no session and sends them back).
 */
const PROTECTED = ["/"];

function hasSupabaseSession(req: NextRequest): boolean {
  return req.cookies
    .getAll()
    .some(c => c.name.startsWith("sb-") && c.name.includes("-auth-token") && c.value.length > 0);
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!hasSupabaseSession(req) && PROTECTED.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
