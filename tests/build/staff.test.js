// Staff directory (DESIGN.md 10.0, 10.11).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, page } from "../helpers/build.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const strings = JSON.parse(readFileSync(path.join(root, "src/_settings/strings.en.json"), "utf8"));
await build();
const doc = page("staff/index.html");
const GROUPS = ["Administration", "Pre-K", "K–2", "3–5", "6–8", "Specials", "Support"];

test("one h2 per group, in the fixed order, with a card per person", () => {
  const h2s = doc.querySelectorAll("main h2").map((h) => h.text.trim());
  assert.deepEqual(h2s, GROUPS);
  const cards = doc.querySelectorAll(".staff-card");
  assert.equal(cards.length, 80);
  for (const section of doc.querySelectorAll("[data-staff-group]")) {
    assert.ok(section.querySelectorAll(".staff-card").length > 0);
  }
  const admin = doc.querySelector('[data-staff-group="Administration"]');
  assert.match(admin.querySelectorAll(".staff-card__name")[0].text, /Keri Mendez/);
  assert.match(admin.querySelectorAll(".staff-card__role")[0].text, /Principal/);
});

test("title, intro and page header", () => {
  assert.equal(doc.querySelector("h1").text.trim(), "Our staff");
  assert.equal(doc.querySelector(".page-header__intro").text.trim(), strings.staff.intro);
});

test("people without a photo get an initials circle and no img", () => {
  for (const card of doc.querySelectorAll(".staff-card")) {
    const circle = card.querySelector(".staff-card__initials");
    assert.ok(circle, "initials circle");
    assert.equal(circle.getAttribute("aria-hidden"), "true");
    assert.match(circle.text.trim(), /^[A-Z]{2}$/);
    assert.equal(card.querySelector("img"), null);
  }
  const first = doc.querySelector(".staff-card__initials").text.trim();
  assert.equal(first, "KM");
});

test("abbreviations are spelled out and no email is published", () => {
  const html = doc.querySelector("main").text;
  assert.doesNotMatch(html, /\bSECA\b|\bELPT\b|CPC Lead/);
  assert.match(html, /Special Education Classroom Assistant/);
  assert.equal(doc.querySelectorAll('a[href^="mailto:"]').length, 0);
});

test("people in several groups appear once per group", () => {
  const n = doc.querySelectorAll(".staff-card__name").filter((e) => /Susan Mitchell/.test(e.text)).length;
  assert.equal(n, 3);
});

test("filter buttons: hidden by default, All plus one per group, aria-pressed", () => {
  const bar = doc.querySelector("[data-staff-filter]");
  assert.ok(bar.hasAttribute("hidden"), "hidden until JS runs");
  const buttons = bar.querySelectorAll("button");
  assert.deepEqual(buttons.map((b) => b.text.trim()), [strings.staff.all, ...GROUPS]);
  for (const b of buttons) assert.ok(["true", "false"].includes(b.getAttribute("aria-pressed")));
  assert.equal(buttons[0].getAttribute("aria-pressed"), "true");
  // Without JavaScript every group is visible.
  assert.equal(doc.querySelectorAll("[data-staff-group][hidden]").length, 0);
});

test("staff menu entries point to /staff/", () => {
  const hrefs = page("index.html").querySelectorAll('a[href$="/school-poc/staff/"]');
  assert.ok(hrefs.length >= 2);
});
