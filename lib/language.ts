"use client";

/**
 * Stand-in for AgentiX's lib/language.ts, so components copied from there
 * (the app launcher) run unchanged. This app is English only for now: `useT()`
 * returns the English text as it is. When German is added, copy AgentiX's
 * language.ts and i18n.ts over this file.
 */
export function useT(): (en: string, vars?: Record<string, string | number>) => string {
  return (en, vars) => {
    let out = en;
    if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
    return out;
  };
}
