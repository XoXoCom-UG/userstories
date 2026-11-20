"use client";

import { useId, useRef, useState } from "react";

/**
 * The page from the Strategy Hub mural (2026-11-19): a Command Pad on the left,
 * "User Stories & Roadmap" on the right, and three small cards under the pad.
 * Not a chatbot — you type one command and the result appears next to it.
 *
 * What is NOT here yet: the AI. Generate only shows where the answer will
 * appear. The next step is one API route that takes the command, calls Claude
 * with the user-story method from AgentiX (lib/method-library.ts there) and
 * streams the stories back.
 */

const PROMPTS = [
  "I have a project that is an online shop for second-hand books. Customers browse, pay and track their order.",
  "Our team is building a mobile app for booking sports courts. I need user stories for the first release.",
  "I want to automate the invoice approval in our company. Accounting, managers and suppliers are involved.",
];

const EXAMPLES = [
  { title: "Booking app", text: "A yoga studio wants customers to book classes, cancel up to 12 hours before, and get a reminder." },
  { title: "Internal tool", text: "Our support team needs one screen that shows a customer's open tickets, orders and last three emails." },
];

type Drawer = "prompts" | "examples" | null;

export function Workbench() {
  const [command, setCommand] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const padRef = useRef<HTMLTextAreaElement>(null);
  const padId = useId();
  const drawerId = useId();

  function fill(text: string) {
    setCommand(text);
    setDrawer(null);
    padRef.current?.focus();
  }

  function submit() {
    const text = command.trim();
    if (text) setSent(text);
  }

  return (
    <div className="workbench">
      <section className="wb-col" aria-labelledby={`${padId}-h`}>
        <h2 className="wb-label" id={`${padId}-h`}>Command Pad</h2>
        <div className="pad">
          <textarea id={padId} ref={padRef} className="pad-input" value={command} rows={7}
            placeholder="I have a project that is…" aria-label="Command Pad"
            onChange={e => setCommand(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }} />
          <div className="pad-foot">
            <span className="pad-hint">Ctrl/⌘ + Enter</span>
            <button className="btn-go" type="button" disabled={!command.trim()} onClick={submit}>Generate</button>
          </div>
        </div>

        <div className="wb-cards" role="group" aria-label="Help with the command">
          <button className="wb-card" type="button" aria-expanded={drawer === "prompts"}
            aria-controls={drawer === "prompts" ? drawerId : undefined}
            onClick={() => setDrawer(d => d === "prompts" ? null : "prompts")}>
            <span className="wb-card-t">Command Prompts</span>
            <span className="wb-card-s">Templates to start from</span>
          </button>
          <div className="wb-card is-soon" aria-disabled="true">
            <span className="wb-card-t">Consultant Support</span>
            <span className="wb-card-s">Soon</span>
          </div>
          <button className="wb-card" type="button" aria-expanded={drawer === "examples"}
            aria-controls={drawer === "examples" ? drawerId : undefined}
            onClick={() => setDrawer(d => d === "examples" ? null : "examples")}>
            <span className="wb-card-t">Success Examples</span>
            <span className="wb-card-s">What a good command looks like</span>
          </button>
        </div>

        {drawer && (
          <ul className="wb-drawer" id={drawerId}>
            {drawer === "prompts"
              ? PROMPTS.map(p => (
                <li key={p}><button type="button" onClick={() => fill(p)}>{p}</button></li>
              ))
              : EXAMPLES.map(x => (
                <li key={x.title}><button type="button" onClick={() => fill(x.text)}><b>{x.title}</b>{x.text}</button></li>
              ))}
          </ul>
        )}
      </section>

      <section className="wb-col" aria-labelledby={`${padId}-o`} aria-live="polite">
        <h2 className="wb-label" id={`${padId}-o`}>User Stories &amp; Roadmap</h2>
        <div className="out">
          {sent === null ? (
            <p className="out-empty">Use the Command Pad to generate your plan.</p>
          ) : (
            <div className="out-note">
              <p className="out-k">Your command</p>
              <p className="out-cmd">{sent}</p>
              <p className="out-k">Status</p>
              <p>The AI is not connected yet — this is where your user stories and roadmap will appear.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
