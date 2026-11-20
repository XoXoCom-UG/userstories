import type { NextConfig } from "next";
import path from "node:path";

/**
 * The same hardening as AgentiX (next.config.ts there). The browser may talk to
 * this site, Supabase (the shared account) and Cloudflare Turnstile (the bot
 * check on the login page) — nothing wider, so a script injected through some
 * future XSS cannot post a session or a document anywhere else.
 */
function originOf(url: string | undefined): string | null {
  try { return url ? new URL(url).origin : null; } catch { return null; }
}
const supabase = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL);
const TURNSTILE = "https://challenges.cloudflare.com";
const connectSrc = ["'self'", TURNSTILE, supabase, supabase?.replace(/^https:/, "wss:")]
  .filter(Boolean).join(" ");

const scriptSrc = process.env.NODE_ENV === "production"
  ? `script-src 'self' 'unsafe-inline' ${TURNSTILE}`
  : `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${TURNSTILE}`;

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      `connect-src ${connectSrc}`,
      `frame-src ${TURNSTILE}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "worker-src 'self' blob:",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // There is an unrelated lockfile higher up; pin the workspace root here.
  turbopack: { root: path.join(__dirname) },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
