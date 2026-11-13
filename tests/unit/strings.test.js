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
