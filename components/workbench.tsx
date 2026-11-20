"use client";

import { useId, useRef, useState } from "react";
import { PrintDoc, RoadmapView, StoriesView, exportPdf } from "@/components/result-view";
import type { Result } from "@/lib/result";

/**
 * The page from the Strategy Hub mural (2026-11-19): a Command Pad on the left,
 * "User Stories & Roadmap" on the right, and cards under the pad. Not a chatbot —
 * you type one command and the result appears next to it.
 *
 * The two columns fill the screen (CSS: .workbench grows to whatever is left
 * under the header), so the Command Pad is as large as the window allows.
 *
 * Nothing here is pre-filled for the person: the pad starts empty, the right
 * panel starts empty, and the two helper cards only explain and offer
 * fill-in-the-blank templates.
 *
 * What is NOT here yet: the AI. Generate only says so. The next step is one API
 * route that takes the command, calls Claude with the user-story method from
 * AgentiX (lib/method-library.ts there) and returns a `Result` (lib/result.ts),
 * validated with `isResult`. That is what will set `shown`; the tabs, the
 * answer view and "Export PDF" below are ready for it and appear only then.
 */

/** A server cap goes here too once the AI route exists; the same number. */
const MAX_COMMAND = 2000;

/**
 * Templates, not examples: the sentence is the shape, the [brackets] are what
 * the person fills in. Tab jumps from one bracket to the next.
 */
const TEMPLATES = [
  { label: "A new product", text: "I have a project that is a [type of product] for [who will use it]. They should be able to [the main thing they do]." },
  { label: "A first release", text: "Our team is building [what] to solve [the problem]. The first release must [the goal] and leave out [what can wait]." },
  { label: "Improving something", text: "We want to improve [the process or product we have today]. The people involved are [roles]. It is a success when [what changes, ideally in numbers]." },
];

/** What a command that works says, in the order people find easiest. */
const GOOD_COMMAND = [
  { k: "Who", v: "Who will use it. A role is enough: customers, support agents, the studio owner." },
  { k: "What", v: "What they should be able to do. One or two things, in plain words." },
  { k: "Why", v: "Why it matters to them. The benefit is what lets us put the stories in order." },
  { k: "Not now", v: "What can wait. Leaving things out is how a first release stays small." },
];

const PLACEHOLDER = /\[[^\]\n]+\]/g;

/** The next [bracket] at or after `from`, as [start, end], or null. */
function nextPlaceholder(text: string, from: number): [number, number] | null {
  PLACEHOLDER.lastIndex = from;
  const m = PLACEHOLDER.exec(text);
  return m ? [m.index, m.index + m[0].length] : null;
}
const hasPlaceholder = (text: string) => nextPlaceholder(text, 0) !== null;

type Drawer = "templates" | "good" | null;
type Tab = "stories" | "roadmap";

/** Small stroke icons for the cards, in the app's own icon weight. */
const ICONS = {
  templates: '<path d="M4 6l5 5-5 5"/><path d="M12 18h8"/>',
  good: '<path d="M12 4l2.3 4.8 5.2.7-3.8 3.6.9 5.2L12 15.8 7.4 18.3l.9-5.2L4.5 9.5l5.2-.7Z"/>',
};

function CardIcon({ name, hue }: { name: keyof typeof ICONS; hue: number }) {
  return (
    <span className="wb-ico" style={{ "--al-hue": hue } as React.CSSProperties} aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        // Static strings from ICONS above, never user or model input.
        dangerouslySetInnerHTML={{ __html: ICONS[name] }} />
    </span>
  );
}

export function Workbench() {
  const [command, setCommand] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  /** The answer on screen. Only the AI step will set this. */
  const [shown, setShown] = useState<Result | null>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [tab, setTab] = useState<Tab>("stories");
  const padRef = useRef<HTMLTextAreaElement>(null);
  const padId = useId();
  const drawerId = useId();

  const unfilled = hasPlaceholder(command);

  /** Puts a template in the pad and selects its first [bracket] to type over. */
  function applyTemplate(text: string) {
    setCommand(text);
    setShown(null);
    setSent(null);
    setDrawer(null);
    requestAnimationFrame(() => {
      const ta = padRef.current;
      if (!ta) return;
      ta.focus();
      const first = nextPlaceholder(text, 0);
      if (first) ta.setSelectionRange(first[0], first[1]);
    });
  }

  function submit() {
    const text = command.trim();
    if (!text || hasPlaceholder(text)) return;
    setSent(text);
    setShown(null);
  }

  function onPadKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); return; }
    // Tab walks the template's [brackets]; with none left it is an ordinary Tab.
    if (e.key === "Tab" && !e.shiftKey && unfilled) {
      const ta = e.currentTarget;
      const next = nextPlaceholder(command, ta.selectionEnd) ?? nextPlaceholder(command, 0);
      if (next) { e.preventDefault(); ta.setSelectionRange(next[0], next[1]); }
    }
  }

  return (
    <div className="workbench">
      <section className="wb-col" aria-labelledby={`${padId}-h`}>
        <h2 className="wb-label" id={`${padId}-h`}>Command Pad</h2>
        <div className="pad">
          <textarea id={padId} ref={padRef} className="pad-input" value={command}
            maxLength={MAX_COMMAND}
            placeholder="I have a project that is…" aria-label="Command Pad"
            onChange={e => setCommand(e.target.value)}
            onKeyDown={onPadKey} />
          <div className="pad-foot">
            <span className="pad-hint">
              {unfilled
                ? <>Fill in the [brackets] — <kbd>Tab</kbd> jumps to the next one</>
                : <><kbd>Ctrl/⌘</kbd> + <kbd>Enter</kbd> to generate</>}
            </span>
            <button className="btn-go" type="button" disabled={!command.trim() || unfilled} onClick={submit}>Generate</button>
          </div>
        </div>

        <div className="wb-cards" role="group" aria-label="Help with the command">
          <button className="wb-card" type="button" aria-expanded={drawer === "templates"}
            aria-controls={drawer === "templates" ? drawerId : undefined}
            onClick={() => setDrawer(d => d === "templates" ? null : "templates")}>
            <CardIcon name="templates" hue={214} />
            <span className="wb-card-t">Command Prompts</span>
            <span className="wb-card-s">Fill-in-the-blank templates</span>
          </button>
          <button className="wb-card" type="button" aria-expanded={drawer === "good"}
            aria-controls={drawer === "good" ? drawerId : undefined}
            onClick={() => setDrawer(d => d === "good" ? null : "good")}>
            <CardIcon name="good" hue={168} />
            <span className="wb-card-t">Success Examples</span>
            <span className="wb-card-s">What a command needs to work well</span>
          </button>
        </div>

        {drawer === "templates" && (
          <ul className="wb-drawer" id={drawerId}>
            {TEMPLATES.map(t => (
              <li key={t.label}>
                <button type="button" onClick={() => applyTemplate(t.text)}>
                  <b>{t.label}</b>{t.text}
                </button>
              </li>
            ))}
          </ul>
        )}
        {drawer === "good" && (
          <div className="wb-tips" id={drawerId}>
            <p className="wb-tips-h">A command that works answers four questions:</p>
            <ul>
              {GOOD_COMMAND.map(g => (
                <li key={g.k}><b>{g.k}</b><span>{g.v}</span></li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="wb-col" aria-labelledby={`${padId}-o`} aria-live="polite">
        <h2 className="wb-label" id={`${padId}-o`}>User Stories &amp; Roadmap</h2>
        <div className="out">
          {shown ? (
            <>
              {/* Only an answer has tabs and an export: with nothing to show, a
                  bar of disabled controls would just be furniture. */}
              <div className="out-bar">
                <div className="seg" role="group" aria-label="Result view">
                  <button type="button" className={tab === "stories" ? "on" : ""} aria-pressed={tab === "stories"} onClick={() => setTab("stories")}>Stories</button>
                  <button type="button" className={tab === "roadmap" ? "on" : ""} aria-pressed={tab === "roadmap"} onClick={() => setTab("roadmap")}>Roadmap</button>
                </div>
                <button className="btn-quiet" type="button" onClick={() => exportPdf(shown)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 4v11" /><path d="M7 11l5 5 5-5" /><path d="M5 20h14" />
                  </svg>
                  Export PDF
                </button>
              </div>
              <div className="out-body">
                <h3 className="out-title">{shown.title}</h3>
                <p className="out-summary">{shown.summary}</p>
                {tab === "stories" ? <StoriesView result={shown} /> : <RoadmapView result={shown} />}
              </div>
              <PrintDoc result={shown} />
            </>
          ) : sent !== null ? (
            <div className="out-body">
              <div className="out-note">
                <p className="out-k">Your command</p>
                <p className="out-cmd">{sent}</p>
                <p className="out-k">Status</p>
                <p>The AI is not connected yet — this is where your user stories and roadmap will appear.</p>
              </div>
            </div>
          ) : (
            <div className="out-empty">
              {/* The mark, large and quiet: a card waiting to be cut. */}
              <svg width="56" height="56" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="oe-a" x1="10" y1="10" x2="26" y2="26" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#9BF5DC" /><stop offset="1" stopColor="#1FA98A" /></linearGradient>
                  <linearGradient id="oe-b" x1="30" y1="14" x2="15" y2="30" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#8FC2FF" /><stop offset="1" stopColor="#2E7BC4" /></linearGradient>
                </defs>
                <path d="M10.5,10.5 L26,10.5 L10.5,26 Z" fill="url(#oe-a)" stroke="url(#oe-a)" strokeWidth="3" strokeLinejoin="round" />
                <path d="M29.9,29.9 L14.4,29.9 L29.9,14.4 Z" fill="url(#oe-b)" stroke="url(#oe-b)" strokeWidth="3" strokeLinejoin="round" />
              </svg>
              <p>Use the Command Pad to generate your plan.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
