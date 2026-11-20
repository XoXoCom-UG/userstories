/**
 * Where to go after signing in: the page the visitor was sent away from
 * (`/login?next=/…`). Only a path inside this app is honoured — another site,
 * `//evil.example`, a `\` that some browsers read as `/` all fall back to the
 * start page. An open redirect on the sign-in page is a phishing tool.
 */
export function safeNext(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (!/^\/(?![/\\])/.test(raw)) return "/";
  if (/[\\\s]|\/\//.test(raw)) return "/";
  // Back to the sign-in page itself would loop.
  if (/^\/(?:login|auth)(?:[/?#]|$)/.test(raw)) return "/";
  return raw;
}

/** The `next` of the current address, made safe. Browser only. */
export function nextFromLocation(): string {
  return safeNext(new URLSearchParams(window.location.search).get("next"));
}
