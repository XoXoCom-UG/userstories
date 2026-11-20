import { test } from "node:test";
import assert from "node:assert/strict";
import { XOXO_APPS } from "./xoxocom-apps.ts";

test("every product has a unique id and name", () => {
  assert.equal(new Set(XOXO_APPS.map(a => a.id)).size, XOXO_APPS.length);
  assert.equal(new Set(XOXO_APPS.map(a => a.name)).size, XOXO_APPS.length);
});

test("an address is either null or an http(s) URL, never a script", () => {
  for (const a of XOXO_APPS) assert.ok(a.href === null || /^https?:\/\//.test(a.href), a.id);
});
