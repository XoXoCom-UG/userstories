"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { AppLauncher, Tile } from "@/components/app-launcher";
import { useAuth } from "@/lib/auth-context";
import { usePresence, phaseClass } from "@/lib/use-presence";
import { XOXO_APPS } from "@/lib/xoxocom-apps";

const SELF = XOXO_APPS.find(a => a.id === "stories")!;

/** The profile picture and its menu: who you are signed in as, and Sign out. */
function AccountMenu() {
  const { user, profileName, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const phase = usePresence(open);
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    }
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const label = profileName || user?.email || "";
  return (
    <div className="avatar-wrap" ref={wrapRef}>
      <button ref={triggerRef} className="avatar" type="button" aria-label="Account menu"
        aria-haspopup="true" aria-expanded={open} aria-controls={open ? id : undefined}
        onClick={() => setOpen(o => !o)}>
        {(label || "U").slice(0, 2).toUpperCase()}
      </button>
      {phase !== "closed" && (
        <div id={id} role="group" aria-label="Account" className={`popover acct-panel t-dropdown${phaseClass(phase)}`} data-origin="top-right">
          <p className="acct-who">
            {profileName && <b>{profileName}</b>}
            <span>{user?.email}</span>
          </p>
          <button className="acct-out" type="button" onClick={() => signOut()}>Sign out</button>
        </div>
      )}
    </div>
  );
}

/**
 * The bar: this product's mark and name on the left; the nine dots, the theme
 * switch and the profile picture on the right — the same order as in every
 * XoXoCom app.
 */
export function Header() {
  const { setTheme } = useTheme();
  return (
    <header className="navbar">
      <Link className="brand" href="/" aria-label="User Story Schneider, home">
        <Tile app={SELF} size={18} />
        <span className="brand-name">User Story Schneider</span>
      </Link>

      <div className="util">
        <AppLauncher current="stories" />

        <button className="icon-btn" type="button" aria-label="Switch light or dark theme"
          data-tooltip="Switch light or dark theme"
          onClick={() => setTheme(document.documentElement.classList.contains("light") ? "dark" : "light")}>
          {/* Both icons, one hidden by the theme class — picking in JS would make
              the server and client markup differ and break hydration. */}
          <svg className="ico-when-dark" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
          </svg>
          <svg className="ico-when-light" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
          </svg>
        </button>

        <AccountMenu />
      </div>
    </header>
  );
}
