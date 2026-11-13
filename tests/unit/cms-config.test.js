import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { parse } from "yaml";

const raw = readFileSync(new URL("../../.pages.yml", import.meta.url), "utf8");
const cfg = parse(raw);
const entry = (name) => cfg.content.find((e) => e.name === name);
const field = (e, name) => e.fields.find((f) => f.name === name);

function walk(fields, fn) {
  for (const f of fields) {
    fn(f, fields);
    if (f.fields) walk(f.fields, fn);
  }
}

test("entries exist for all editable content", () => {
  const labels = cfg.content.map((e) => e.label);
  for (const l of ["School details", "Alert banner", "Homepage", "News", "About pages", "Families pages", "Enroll page", "Contact page", "Staff"]) {
    assert.ok(labels.includes(l), `missing entry ${l}`);
  }
});

test("media input is src/images", () => {
  assert.equal(cfg.media.input, "src/images");
  assert.equal(cfg.media.output, "/images");
});

test("every image field has a string alt sibling", () => {
  let count = 0;
  for (const e of cfg.content) {
    walk(e.fields, (f, siblings) => {
      if (f.type !== "image") return;
      count++;
      const alt = f.name === "image" ? "image_alt" : `${f.name.replace(/_image$/, "")}_alt`;
      const sib = siblings.find((s) => s.name === alt);
      assert.ok(sib, `${e.name}.${f.name} lacks ${alt}`);
      assert.equal(sib.type, "string");
    });
  }
  assert.ok(count >= 3);
});

test("alert: level select and required end datetime", () => {
  const a = entry("alert");
  assert.equal(a.path, "src/_settings/alert.json");
  const level = field(a, "level");
  assert.equal(level.type, "select");
  const names = level.options.values.map((v) => v.name ?? v);
  assert.deepEqual(names, ["notice", "closed", "emergency"]);
  const end = field(a, "end");
  assert.equal(end.type, "date");
  assert.equal(end.options.time, true);
  assert.equal(end.required, true);
});

test("news: required fields, filename, excludes non-posts", () => {
  const n = entry("news");
  for (const f of ["title", "date", "summary"]) assert.equal(field(n, f).required, true);
  assert.equal(n.filename, "{year}-{month}-{day}-{primary}.md");
  assert.ok(n.exclude.includes("index.njk") && n.exclude.includes("news.json"));
});

test("staff: group select with seven groups, people.json excluded", () => {
  const s = entry("staff");
  assert.deepEqual(field(s, "group").options.values.map((v) => v.name), ["Administration", "Pre-K", "K–2", "3–5", "6–8", "Specials", "Support"]);
  assert.ok(s.exclude.includes("people.json"));
});

test("collection and file paths exist; calendar.json is not referenced", () => {
  for (const e of cfg.content) {
    assert.ok(existsSync(new URL(`../../${e.path}`, import.meta.url)), `${e.path} missing`);
  }
  assert.ok(!raw.includes("calendar.json"));
});

test("page entries: section only hidden, order is a number", () => {
  for (const name of ["about", "families", "enroll", "contact"]) {
    const e = entry(name);
    const section = field(e, "section");
    assert.equal(section.hidden, true, `${name} section must be hidden`);
    assert.equal(section.default, name);
    if (e.type === "collection") assert.equal(field(e, "order").type, "number");
  }
});

test("help text on risky fields", () => {
  assert.match(field(entry("alert"), "end").description, /disappears automatically/);
  assert.match(field(entry("alert"), "link").description, /\/news\//);
  assert.match(field(entry("home"), "hero_alt").description, /can't see it/);
  assert.match(field(entry("news"), "image_alt").description, /can't see it/);
});

test("menu-only files (menu_url / external_url) are excluded from collections", () => {
  for (const e of cfg.content.filter((c) => c.type === "collection")) {
    const dir = new URL(`../../${e.path}/`, import.meta.url);
    for (const f of readdirSync(dir).filter((n) => n.endsWith(".md"))) {
      if (/^\s*(menu_url|external_url):/m.test(readFileSync(new URL(f, dir), "utf8"))) {
        assert.ok(e.exclude?.includes(f), `${e.name} must exclude ${f}`);
      }
    }
  }
});
