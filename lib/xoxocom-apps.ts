/**
 * The XoXoCom products, in one list — what the app launcher in the header
 * (components/app-launcher.tsx) draws.
 *
 * Kick-off "XoXoCom 2", 2026-11-11, and the Strategy Hub mural of 2026-11-19:
 * Agentics is cut into small, single-purpose "submarines" that sell the big
 * product up, and every one of them carries the same launcher next to the
 * profile picture (Ana, 2026-11-19: "ca la Google, la toate aplicatiile").
 *
 * THIS FILE IS THE CONTRACT BETWEEN THE APPS. Each product is its own
 * deployment on its own domain, so each repo holds a copy of this file and of
 * app-launcher.tsx. Adding a product means adding one entry here and pasting
 * the same entry into every other app's copy — keep the order and ids identical.
 *
 * No React and no "@/" imports, so the test runner can load it and so the copy
 * works in any app.
 */

export type XoxoAppId = "agentix" | "architect" | "stories" | "coach";

export type XoxoApp = {
  id: XoxoAppId;
  /** A product's name is a name — it is not translated. */
  name: string;
  /** What it does, in the launcher's own words. */
  blurb: string;
  /** The colour of its tile. One hue each, so the grid is read by colour first. */
  hue: number;
  /** Where it lives. null = not built yet: drawn dimmed, "Soon", not a link. */
  href: string | null;
};

/**
 * Addresses come from the environment, one variable per product, so a product
 * going live is a deploy setting and not a commit in every app. Each reference
 * is written out in full on purpose: Next only inlines NEXT_PUBLIC_* where the
 * name is a literal, never through process.env[someKey].
 *
 * An empty string counts as "not set" — a blank line in .env.local must not
 * turn into a link to the current page. Only http(s) addresses count: the
 * value ends up in an href, and a `javascript:` address there would run.
 */
function url(v: string | undefined): string | null {
  const s = v?.trim();
  return s && /^https?:\/\//i.test(s) ? s : null;
}

export const XOXO_APPS: readonly XoxoApp[] = [
  {
    id: "agentix",
    name: "AgentiX Projects",
    blurb: "Consultant and Coach for your project",
    hue: 214,
    href: url(process.env.NEXT_PUBLIC_APP_URL_AGENTIX),
  },
  {
    id: "architect",
    name: "AI Project Architect",
    blurb: "Type a goal, get the plan",
    hue: 262,
    href: url(process.env.NEXT_PUBLIC_APP_URL_ARCHITECT),
  },
  {
    id: "stories",
    name: "User Story Schneider",
    blurb: "Turn an idea into user stories",
    hue: 168,
    href: url(process.env.NEXT_PUBLIC_APP_URL_STORIES),
  },
  {
    id: "coach",
    name: "Personal Business Coach",
    blurb: "Your career, goals and skills",
    hue: 28,
    href: url(process.env.NEXT_PUBLIC_APP_URL_COACH),
  },
];
