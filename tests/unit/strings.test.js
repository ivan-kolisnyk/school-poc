// Interface strings (DESIGN.md 14): every string in the file is used, so translators never
// translate dead text and the Spanish-ready file stays honest.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const strings = JSON.parse(readFileSync(path.join(root, "src/_settings/strings.en.json"), "utf8"));
const files = execFileSync("git", ["ls-files", "src", "lib", "eleventy.config.js"], { cwd: root, encoding: "utf8" })
  .split("\n")
  .filter((f) => /\.(njk|md|js)$/.test(f));
const source = files.map((f) => readFileSync(path.join(root, f), "utf8")).join("\n");

// Groups read with a computed key, e.g. strings.nav[item.key], strings.alertLabels[level].
const DYNAMIC = new Set(["nav", "alertLabels"]);

function leaves(obj, prefix = []) {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v) ? leaves(v, [...prefix, k]) : [[...prefix, k]]);
}

test("every interface string is used by a template or script", () => {
  const unused = leaves(strings).filter((p) => {
    const [group, ...rest] = p;
    const dotted = `.${p.join(".")}`;
    const bracket = `.${[group, ...rest.slice(0, -1)].join(".")}["${rest.at(-1)}"]`;
    if (source.includes(dotted) || source.includes(bracket)) return false;
    return !(DYNAMIC.has(group) && source.includes(`strings.${group}[`));
  });
  assert.deepEqual(unused.map((p) => p.join(".")), []);
});

test("the copyright line is named for what it holds", () => {
  assert.equal(strings.footer.rights, undefined);
  assert.equal(strings.footer.copyrightHolder, "Mary E. Courtenay Language Arts Center");
});

// Step 2 of the quality pass: a test-only Spanish sample (DESIGN.md 14) checks that layouts
// survive ~25% longer labels at 320px. It must stay a full copy of the English file.
const es = JSON.parse(readFileSync(path.join(root, "tests/fixtures/strings-es-sample.json"), "utf8"));
const shape = (o) => (Array.isArray(o) ? o.map(shape) : o && typeof o === "object"
  ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, shape(v)])) : typeof o);

test("the Spanish sample has exactly the English keys", () => {
  const en = shape(strings);
  en.quickTasks.items = strings.quickTasks.items.map((i) => i.key);
  const sample = shape(es);
  sample.quickTasks.items = es.quickTasks.items.map((i) => i.key);
  assert.deepEqual(sample, en);
  assert.deepEqual(es.staff.groups, strings.staff.groups, "group names are data keys, not labels");
});

test("the Spanish sample carries the DESIGN.md 14 labels and runs longer", () => {
  assert.equal(es.home.enrollNow.toUpperCase(), "INSCRIBIR AHORA");
  assert.equal(es.home.bookTour.toUpperCase(), "AGENDAR UNA VISITA");
  assert.equal(es.quickTasks.items.find((i) => i.key === "lunchMenu").label, "Menú del almuerzo");
  assert.deepEqual(Object.values(es.alertLabels).map((l) => l.toUpperCase()), ["AVISO", "CERRADO", "EMERGENCIA"]);
  const len = (list) => list.join("").length;
  const navKeys = ["about", "families", "enroll", "news", "contact"];
  assert.ok(len(navKeys.map((k) => es.nav[k])) >= 1.25 * len(navKeys.map((k) => strings.nav[k])), "nav labels");
  const tasks = (s) => s.quickTasks.items.map((i) => i.label);
  assert.ok(len(tasks(es)) >= 1.25 * len(tasks(strings)), "quick-task labels");
  const buttons = (s) => [s.home.enrollNow, s.home.bookTour, s.home.seeAllNews, s.events.seeFullCalendar, s.search.submit];
  assert.ok(len(buttons(es)) >= 1.25 * len(buttons(strings)), "button labels");
});
