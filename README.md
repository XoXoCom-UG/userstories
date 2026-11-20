# User Story Schneider

One of the small XoXoCom apps cut out of AgentiX (kick-off "XoXoCom 2", 2026-11-11):
describe a project in the Command Pad, get user stories and a roadmap next to it.
Not a chatbot.

**Status:** page and sign-in work. The AI step (one API route that sends the
command to Claude) is not built yet — Generate only shows where the answer will go.

## Run

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # http://localhost:3200
npm test
```

## One account for all XoXoCom apps

Sign-in uses the **same Supabase project as AgentiX**, so one account works in
every product. Each product is on its own domain and signs you in separately
(cookies do not cross domains — on purpose).

| Variable | What |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the shared project (public values) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | bot check for this app's domain; set it **before** CAPTCHA is switched on in Supabase |
| `NEXT_PUBLIC_APP_URL_AGENTIX` / `_ARCHITECT` / `_STORIES` / `_COACH` | where each product lives, for the app launcher (empty = "Soon") |

**Never put the Supabase service-role key in this app.** It bypasses every access
rule; this app only needs the public key. Anything that must write privileged data
(e.g. a token wallet) belongs behind a server route that checks the user's token.

Before a new domain works, add it in Supabase → Authentication → URL Configuration →
Redirect URLs (exact address, no wildcard) — the sign-up confirmation link goes to
`/auth/callback` — and in Cloudflare Turnstile.

## The app launcher

The nine dots next to the profile picture list every XoXoCom product
(`components/app-launcher.tsx`, `lib/xoxocom-apps.ts`). Each product keeps a copy of
these two files; keep ids and order identical when adding a product.
