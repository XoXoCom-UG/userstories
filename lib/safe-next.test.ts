import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNext } from "./safe-next.ts";

test("a path inside the app is kept", () => {
  assert.equal(safeNext("/"), "/");
  assert.equal(safeNext("/history?x=1"), "/history?x=1");
});

test("anything that leaves the app, or loops, goes to the start page", () => {
  for (const bad of [null, undefined, "", "https://evil.example", "//evil.example", "/\\evil", "/a//b", "javascript:alert(1)", "/login", "/auth/callback", "/ x"]) {
    assert.equal(safeNext(bad), "/", String(bad));
  }
});
