"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePresence, phaseClass } from "@/lib/use-presence";
import { useT } from "@/lib/language";
import { XOXO_APPS, type XoxoApp, type XoxoAppId } from "@/lib/xoxocom-apps";

/**
 * The nine dots next to the profile picture (Ana, 2026-11-19): one click opens
 * every XoXoCom product, the way Google's grid does. Every app carries the
 * same button; `current` marks the one you are in.
 *
 * Copy this file with lib/xoxocom-apps.ts into each app. It leans on three
 * things every app has: usePresence (the exit animation), useT, and the
 * `.al-*` rules in ui.css.
 */

/** Each product's mark, drawn in a 24-unit box with the header's stroke weight. */
export const GLYPH: Record<XoxoAppId, string> = {
  // Two strokes crossing, the AgentiX X.
  agentix: '<path d="M7 7l10 10"/><path d="M17 7L7 17"/>',
  // A set square over a plan.
  architect: '<path d="M5 19V5l14 14H5Z"/><path d="M9 19v-4M13 19v-2"/>',
  // A card cut in two.
  stories: '<rect x="4" y="5" width="16" height="6" rx="1.5"/><rect x="4" y="14" width="10" height="5" rx="1.5"/><path d="M17 15l3 4M20 15l-3 4"/>',
  // A rising path to a flag.
  coach: '<path d="M5 19c4 0 3-6 7-6s3-6 7-6"/><path d="M19 7V3"/><path d="M19 3h-3"/>',
};

export function Tile({ app, size = 20 }: { app: XoxoApp; size?: number }) {
  return (
    <span className="al-tile" style={{ "--al-hue": app.hue } as React.CSSProperties} aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        // Static strings from GLYPH above, never user or model input.
        dangerouslySetInnerHTML={{ __html: GLYPH[app.id] }} />
    </span>
  );
}

export function AppLauncher({ current }: { current: XoxoAppId }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const phase = usePresence(open);
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // A click anywhere outside the button and its panel closes it.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  // Focus moves into the panel when it opens: the first product you can open.
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
  }, [open]);

  function links(): HTMLElement[] {
    return Array.from(menuRef.current?.querySelectorAll<HTMLElement>("a[href]") ?? []);
  }

  function onKey(e: React.KeyboardEvent<HTMLDivElement>) {
    const list = links();
    const i = list.indexOf(document.activeElement as HTMLElement);
    let next: HTMLElement | undefined;
    // The panel is a two-column grid: left/right walk one, up/down walk a row.
    if (e.key === "ArrowRight") next = list[(i + 1) % list.length];
    else if (e.key === "ArrowLeft") next = list[(i - 1 + list.length) % list.length];
    else if (e.key === "ArrowDown") next = list[Math.min(i + 2, list.length - 1)];
    else if (e.key === "ArrowUp") next = list[Math.max(i - 2, 0)];
    else if (e.key === "Escape") {
      e.preventDefault(); e.stopPropagation();
      setOpen(false); triggerRef.current?.focus(); return;
    }
    // Tab leaves the panel rather than walking through it.
    else if (e.key === "Tab") { setOpen(false); return; }
    if (next) { e.preventDefault(); next.focus(); }
  }

  return (
    <div className="al-wrap" ref={wrapRef}>
      <button ref={triggerRef} className="icon-btn al-btn" type="button"
        data-tooltip={t("XoXoCom apps")} aria-label={t("XoXoCom apps")}
        aria-haspopup="true" aria-expanded={open} aria-controls={open ? menuId : undefined}
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}>
        {/* Nine dots, 3 × 3 — Google's shape, so it reads as "my apps" without a label. */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {[5, 12, 19].flatMap(y => [5, 12, 19].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.9" />))}
        </svg>
      </button>

      {phase !== "closed" && (
        <div ref={menuRef} id={menuId} role="group" aria-label={t("Our apps")}
          className={`popover al-panel t-dropdown${phaseClass(phase)}`} data-origin="top-right"
          onKeyDown={onKey} onClick={e => e.stopPropagation()}>
          <p className="al-head">{t("Our apps")}</p>
          <div className="al-grid">
            {XOXO_APPS.map(app => {
              const here = app.id === current;
              // The app you are in always opens (to its own start page), even
              // before its address is set in the environment.
              const href = app.href ?? (here ? "/" : null);
              const body = (
                <>
                  <Tile app={app} />
                  <span className="al-name">{app.name}</span>
                  <span className="al-blurb">{t(app.blurb)}</span>
                  {here && <span className="al-tag">{t("You are here")}</span>}
                  {!href && <span className="al-tag">{t("Soon")}</span>}
                </>
              );
              // Not built yet: a plain box, not a link that goes nowhere.
              return href ? (
                <a key={app.id} className={`al-item${here ? " is-current" : ""}`} href={href}
                  aria-current={here ? "page" : undefined} onClick={() => setOpen(false)}>
                  {body}
                </a>
              ) : (
                <div key={app.id} className="al-item is-soon" aria-disabled="true">{body}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
