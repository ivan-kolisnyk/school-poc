// CI workflow (.github/workflows/deploy.yml): action majors and the a11y job's cache use.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const wf = parse(readFileSync(new URL("../../.github/workflows/deploy.yml", import.meta.url), "utf8"));
const uses = (job) => wf.jobs[job].steps.map((s) => s.uses).filter(Boolean);
const runs = (job) => wf.jobs[job].steps.map((s) => s.run).filter(Boolean);

test("cache and upload-artifact are on their current majors (cache v6, upload-artifact v7)", () => {
  const all = Object.keys(wf.jobs).flatMap(uses);
  for (const u of all.filter((x) => x.startsWith("actions/cache"))) assert.match(u, /@v6$/, u);
  for (const u of all.filter((x) => x.startsWith("actions/upload-artifact"))) assert.match(u, /@v7$/, u);
});

test("only the build job saves the calendar cache; the a11y job restores it", () => {
  assert.ok(uses("build").includes("actions/cache@v6"));
  assert.ok(!uses("a11y").includes("actions/cache@v6"), "a11y must not re-save under the build key");
  assert.ok(uses("a11y").includes("actions/cache/restore@v6"));
});

test("the a11y job runs the Spanish-sample overflow check and uploads its report", () => {
  assert.ok(runs("a11y").includes("npm run test:a11y:es"));
  const upload = wf.jobs.a11y.steps.find((s) => String(s.uses).startsWith("actions/upload-artifact"));
  assert.match(upload.with.path, /playwright-report-es\//);
  assert.match(upload.with.path, /test-results\/a11y-es\.json/);
});

test("the deploy is gated only by the content-independent suite", () => {
  const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  assert.deepEqual(runs("test"), ["npm ci", "npm test"]);
  assert.deepEqual(wf.jobs.build.needs, "test");
  assert.doesNotMatch(pkg.scripts.test, /tests\/content|tests\/a11y/, "content rules never block a publish");
  assert.match(pkg.scripts.test, /tests\/regression/, "the CMS-edit regression test gates");
  assert.equal(pkg.scripts["test:gating"], 'node --test "tests/unit/*.test.js" "tests/build/*.test.js"');
  assert.ok(runs("a11y").includes("npm run test:content"), "content rules run in the non-blocking a11y job");
  assert.equal(wf.jobs.a11y["continue-on-error"], true);
});

test("a save during a deploy does not cancel it", () => {
  assert.equal(wf.concurrency.group, "pages");
  assert.equal(wf.concurrency["cancel-in-progress"], false);
});
