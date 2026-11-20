"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { sentence, type Result, type Story } from "@/lib/result";

/**
 * An answer, drawn two ways from the same data: on screen (ResultView, the
 * Stories and Roadmap tabs) and on paper (PrintDoc, what "Export PDF" prints).
 */

function Sentence({ s }: { s: Story }) {
  return (
    <p className="rs-as">As a <i>{s.role}</i>, I want to <i>{s.action}</i>, so that <i>{s.benefit}</i>.</p>
  );
}

export function StoriesView({ result }: { result: Result }) {
  return (
    <div className="rs-grid">
      {result.stories.map(s => (
        <article className="rs-card" key={s.id}>
          <div className="rs-top">
            <span className={`rs-chip ${s.priority.toLowerCase()}`}>{s.priority}</span>
            <span className="rs-id">{s.id}</span>
          </div>
          <Sentence s={s} />
          <p className="rs-ac-h">Acceptance criteria</p>
          <ul className="rs-ac">
            {s.criteria.map(c => <li key={c}>{c}</li>)}
          </ul>
        </article>
      ))}
    </div>
  );
}

export function RoadmapView({ result }: { result: Result }) {
  const byId = new Map(result.stories.map(s => [s.id, s]));
  return (
    <div className="rs-road">
      {result.roadmap.map(p => (
        <section className="rs-phase" key={p.name}>
          <h3 className="rs-pname">{p.name}</h3>
          <div className="rs-pbody">
            <p className="rs-goal">{p.goal}</p>
            <ul className="rs-pstories">
              {p.stories.map(id => {
                const s = byId.get(id);
                return s ? (
                  <li key={id}>
                    <span className={`rs-chip ${s.priority.toLowerCase()}`}>{s.priority}</span>
                    <span className="rs-id">{s.id}</span>
                    <span className="rs-pact">{s.action}</span>
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        </section>
      ))}
    </div>
  );
}

/* ---------- On paper ---------- */

const noSubscribe = () => () => {};

/**
 * The document the browser prints. It is portalled to <body>, outside the app
 * shell, so the print stylesheet can hide the whole shell and show only this —
 * and it is hidden on screen. Nothing here is interactive.
 */
export function PrintDoc({ result }: { result: Result }) {
  // document.body exists only in the browser; useSyncExternalStore gives the
  // server and the first client render the same (null) answer without an effect.
  const host = useSyncExternalStore(noSubscribe, () => document.body, () => null);
  if (!host) return null;
  const byId = new Map(result.stories.map(s => [s.id, s]));
  return createPortal(
    <div className="print-doc">
      <header className="pd-head">
        <p className="pd-kicker">User Story Schneider</p>
        <h1>{result.title}</h1>
        <p className="pd-summary">{result.summary}</p>
      </header>

      <h2>User stories</h2>
      {result.stories.map(s => (
        <section className="pd-story" key={s.id}>
          <p className="pd-meta"><b>{s.id}</b> · {s.priority}</p>
          <p className="pd-sentence">{sentence(s)}</p>
          <p className="pd-ac-h">Acceptance criteria</p>
          <ul>{s.criteria.map(c => <li key={c}>{c}</li>)}</ul>
        </section>
      ))}

      <h2 className="pd-break">Roadmap</h2>
      {result.roadmap.map(p => (
        <section className="pd-phase" key={p.name}>
          <h3>{p.name}</h3>
          <p className="pd-goal">{p.goal}</p>
          <ul>
            {p.stories.map(id => {
              const s = byId.get(id);
              return s ? <li key={id}><b>{s.id}</b> ({s.priority}) — {s.role}: {s.action}</li> : null;
            })}
          </ul>
        </section>
      ))}

      <footer className="pd-foot">Created with User Story Schneider · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</footer>
    </div>,
    host,
  );
}

/**
 * Opens the browser's print dialog, where "Save as PDF" is a destination on
 * every platform. The tab title is the suggested file name, so it is set to the
 * result's title for the moment of printing and put back afterwards.
 */
export function exportPdf(result: Result): void {
  const previous = document.title;
  document.title = `${result.title} - user stories`;
  const restore = () => {
    document.title = previous;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}
