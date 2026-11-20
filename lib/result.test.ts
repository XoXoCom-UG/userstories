import { test } from "node:test";
import assert from "node:assert/strict";
import { isResult, sentence, type Result } from "./result.ts";
import { FIXTURES as EXAMPLES } from "./result.fixture.ts";

test("every example is a valid result", () => {
  for (const e of EXAMPLES) assert.equal(isResult(e.result), true, e.title);
});

test("every example's roadmap uses each story once", () => {
  for (const e of EXAMPLES) {
    const used = e.result.roadmap.flatMap(p => p.stories).sort();
    const all = e.result.stories.map(s => s.id).sort();
    assert.deepEqual(used, all, e.title);
  }
});

test("a roadmap that names a story that does not exist is refused", () => {
  const bad: Result = structuredClone(EXAMPLES[0].result);
  bad.roadmap[0].stories.push("US-99");
  assert.equal(isResult(bad), false);
});

test("duplicate ids, unknown priorities and missing criteria are refused", () => {
  const dup = structuredClone(EXAMPLES[0].result);
  dup.stories[1].id = dup.stories[0].id;
  assert.equal(isResult(dup), false);

  const prio = structuredClone(EXAMPLES[0].result) as unknown as { stories: { priority: string }[] };
  prio.stories[0].priority = "Wish";
  assert.equal(isResult(prio), false);

  const none = structuredClone(EXAMPLES[0].result);
  none.stories[0].criteria = [];
  assert.equal(isResult(none), false);
});

test("things that are not results are refused", () => {
  for (const v of [null, undefined, "x", 3, [], {}, { title: "t" }]) assert.equal(isResult(v), false);
});

test("the story sentence reads as one sentence", () => {
  assert.equal(
    sentence({ role: "customer", action: "book a class", benefit: "I have a spot" }),
    "As a customer, I want to book a class, so that I have a spot.",
  );
});
