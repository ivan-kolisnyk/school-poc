// Homepage content model (src/index.md, edited in Pages CMS as "Homepage").
// Only what the CMS guarantees is checked here; the values are the principal's to change.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { home, readFrontMatter } from "../helpers/content.js";

test("home front matter parses and has exactly 3 pride items (the CMS list is min 3, max 3)", () => {
  const { data } = home();
  assert.ok(Array.isArray(data.pride), "pride is a list");
  assert.equal(data.pride.length, 3);
  for (const p of data.pride) assert.equal(typeof p, "object", "each pride item is a value/label pair");
  assert.equal(data.layout, "layouts/home.njk");
});

test("a file without front matter fails with a clear message, not a null crash", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "courtenay-fm-"));
  const file = path.join(dir, "broken.md");
  writeFileSync(file, "hero_heading: no fences\n");
  assert.throws(() => readFrontMatter(file), /no YAML front matter/);
});
