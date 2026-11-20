/**
 * What an answer looks like: user stories with acceptance criteria and a MoSCoW
 * priority, and a roadmap that groups them into Now / Next / Later. The screen
 * and the PDF both draw from this one shape, so they cannot disagree.
 *
 * The AI route (not built yet) has to return exactly this, validated by
 * `isResult` before anything is drawn: a model's answer is text until it has
 * passed it.
 *
 * No React and no "@/" imports, so the test runner can load it.
 */

export type Priority = "Must" | "Should" | "Could";

export type Story = {
  /** "US-01": how the roadmap and the reader refer to it. */
  id: string;
  priority: Priority;
  /** "As a <role>, I want to <action>, so that <benefit>." — three parts, so the
   *  screen can set them apart from the glue words. `action` has no leading "to". */
  role: string;
  action: string;
  benefit: string;
  /** Testable statements; what "done" means for this story. */
  criteria: string[];
};

export type Phase = {
  /** "Now", "Next", "Later". */
  name: string;
  /** What is true for the people using it when this phase is done. */
  goal: string;
  /** Story ids, in the order they should be built. */
  stories: string[];
};

export type Result = {
  title: string;
  summary: string;
  stories: Story[];
  roadmap: Phase[];
};

const PRIORITIES: readonly string[] = ["Must", "Should", "Could"];

function isText(v: unknown, max = 500): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.length <= max;
}

/**
 * Whether `v` is a usable Result: every story has its three parts and at least
 * one criterion, ids are unique, and every roadmap entry names a story that
 * exists (a dangling id would draw an empty chip and a broken PDF).
 */
export function isResult(v: unknown): v is Result {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  if (!isText(r.title, 120) || !isText(r.summary, 600)) return false;
  if (!Array.isArray(r.stories) || r.stories.length === 0 || r.stories.length > 40) return false;
  const ids = new Set<string>();
  for (const s of r.stories as Record<string, unknown>[]) {
    if (!s || typeof s !== "object") return false;
    if (!isText(s.id, 16) || ids.has(s.id as string)) return false;
    ids.add(s.id as string);
    if (typeof s.priority !== "string" || !PRIORITIES.includes(s.priority)) return false;
    if (!isText(s.role, 120) || !isText(s.action, 240) || !isText(s.benefit, 240)) return false;
    if (!Array.isArray(s.criteria) || s.criteria.length === 0 || s.criteria.length > 10) return false;
    if (!s.criteria.every(c => isText(c, 300))) return false;
  }
  if (!Array.isArray(r.roadmap) || r.roadmap.length === 0 || r.roadmap.length > 6) return false;
  for (const p of r.roadmap as Record<string, unknown>[]) {
    if (!p || typeof p !== "object") return false;
    if (!isText(p.name, 40) || !isText(p.goal, 240)) return false;
    if (!Array.isArray(p.stories) || !p.stories.every(id => typeof id === "string" && ids.has(id))) return false;
  }
  return true;
}

/** The story sentence as one string, for the PDF and for tests. */
export function sentence(s: Pick<Story, "role" | "action" | "benefit">): string {
  return `As a ${s.role}, I want to ${s.action}, so that ${s.benefit}.`;
}
