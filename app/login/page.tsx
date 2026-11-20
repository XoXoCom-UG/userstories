"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { nextFromLocation } from "@/lib/safe-next";
import { captureBetaKeyFromUrl } from "@/lib/beta-key-handoff";
import { Turnstile, TURNSTILE_SITE_KEY, type TurnstileHandle } from "@/components/turnstile";
import { Tile } from "@/components/app-launcher";
import { XOXO_APPS } from "@/lib/xoxocom-apps";

type Mode = "signin" | "signup";
const SELF = XOXO_APPS.find(a => a.id === "stories")!;

/** Loose on purpose: catches a missing @ or dot, leaves the verdict to the server. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Supabase's raw errors are written for developers; this is what a person can act on. */
function friendlyError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match.";
  if (m.includes("email not confirmed")) return "Confirm your email first. The link is in your inbox.";
  if (m.includes("already registered") || m.includes("already exists")) return "That email may already have an account. Try signing in.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a minute, then try again.";
  if (m.includes("captcha")) return "The security check didn't go through. Wait for it to finish, then try again.";
  if (m.includes("password should be at least")) return "Use at least 8 characters.";
  if (m.includes("invalid email") || m.includes("unable to validate email")) return "That email address doesn't look right.";
  if (m.includes("network") || m.includes("failed to fetch")) return "No connection to the server. Check your internet.";
  return raw;
}

type Errors = { email?: string; password?: string };

/**
 * One XoXoCom account for every product. You sign in here separately from the
 * other products (they are different domains), with the same email and
 * password. Sign-up is the same account AgentiX uses.
 */
export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { token, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  // The bot check's answer: one request each, reset after every use.
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaFailed, setCaptchaFailed] = useState(false);
  const captcha = useRef<TurnstileHandle>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  // The invitation email links here with the key in the fragment. Take it before
  // anything navigates away and drops it (see lib/beta-key-handoff.ts).
  useEffect(() => { captureBetaKeyFromUrl(); }, []);

  // Came back to /login while already signed in.
  useEffect(() => { if (!authLoading && token) router.replace(nextFromLocation()); }, [token, authLoading, router]);

  function switchMode(next: Mode) { setMode(next); setNote(null); setErrors({}); }

  function validate(): Errors {
    const e: Errors = {};
    const mail = email.trim();
    if (!mail) e.email = "Enter your email address.";
    else if (!EMAIL_RE.test(mail)) e.email = "That email address doesn't look right.";
    if (!password) e.password = "Enter your password.";
    else if (mode === "signup" && password.length < 8) e.password = "Use at least 8 characters.";
    return e;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (busy) return;
    setNote(null);
    const found = validate();
    setErrors(found);
    if (found.email) { emailRef.current?.focus(); return; }
    if (found.password) { pwRef.current?.focus(); return; }

    // Without a site key there is no check and nothing to wait for — right only
    // while CAPTCHA is also off in Supabase.
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setNote({
        text: captchaFailed
          ? "The security check couldn't load. Turn off any content blocker for this page and reload."
          : "One moment — the security check is still running.",
        ok: false,
      });
      return;
    }
    const captcha_ = TURNSTILE_SITE_KEY ? captchaToken ?? undefined : undefined;

    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(), password, options: { captchaToken: captcha_ },
        });
        if (error) setNote({ text: friendlyError(error.message), ok: false });
        else router.replace(nextFromLocation());
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: {
          data: name.trim() ? { full_name: name.trim() } : undefined,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          captchaToken: captcha_,
        },
      });
      if (error) { setNote({ text: friendlyError(error.message), ok: false }); return; }
      // With email confirmation off, sign-up returns a session: let them in.
      if (data.session) { router.replace(nextFromLocation()); return; }
      setNote({ text: "Almost there. Confirm your email with the link we just sent you.", ok: true });
      setMode("signin");
    } finally {
      setBusy(false);
      // Spent, whatever the outcome: the next try needs a fresh one.
      captcha.current?.reset();
    }
  }

  const signup = mode === "signup";
  return (
    <main className="auth">
      <div className="auth-card">
        <div className="auth-brand"><Tile app={SELF} size={22} /><span>User Story Schneider</span></div>
        <h1>{signup ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-sub">
          {signup
            ? "One XoXoCom account works in all our apps."
            : "Sign in with your XoXoCom account. It is the same one you use in AgentiX."}
        </p>

        <div className="auth-tabs" role="group" aria-label="Sign in or create an account">
          <button type="button" aria-pressed={!signup} className={!signup ? "on" : ""} onClick={() => switchMode("signin")}>Sign in</button>
          <button type="button" aria-pressed={signup} className={signup ? "on" : ""} onClick={() => switchMode("signup")}>Create account</button>
        </div>

        <form onSubmit={submit} noValidate>
          {signup && (
            <div className="field">
              <label htmlFor={`${uid}-name`}>Your name</label>
              <input id={`${uid}-name`} type="text" value={name} autoComplete="name" placeholder="Alex"
                onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div className="field">
            <label htmlFor={`${uid}-email`}>Email</label>
            <input id={`${uid}-email`} ref={emailRef} type="email" value={email} autoComplete="email" inputMode="email"
              placeholder="name@company.com" aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? `${uid}-email-e` : undefined}
              onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(x => ({ ...x, email: undefined })); }} />
            {errors.email && <p className="field-err" id={`${uid}-email-e`}>{errors.email}</p>}
          </div>
          <div className="field">
            <label htmlFor={`${uid}-pw`}>Password</label>
            <input id={`${uid}-pw`} ref={pwRef} type="password" value={password}
              autoComplete={signup ? "new-password" : "current-password"} aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? `${uid}-pw-e` : undefined}
              onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(x => ({ ...x, password: undefined })); }} />
            {signup && !errors.password && <p className="field-hint">At least 8 characters</p>}
            {errors.password && <p className="field-err" id={`${uid}-pw-e`}>{errors.password}</p>}
          </div>

          <Turnstile ref={captcha} onToken={setCaptchaToken} onFail={() => setCaptchaFailed(true)} />

          {note && <div className={`auth-note ${note.ok ? "ok" : "bad"}`} role="status">{note.text}</div>}

          <button className="btn-go btn-wide" type="submit" disabled={busy}>
            {busy ? "One moment…" : signup ? "Create account" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
