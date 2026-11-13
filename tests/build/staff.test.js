// Staff directory (DESIGN.md 10.0, 10.11).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { build, page, buildLog } from "../helpers/build.js";
import { root, staffPeople, showsPhoto } from "../helpers/content.js";
import { initials } from "../../lib/staff.js"; // its honorific rule is pinned by the "FA" fixture test below

const strings = JSON.parse(readFileSync(path.join(root, "src/_settings/strings.en.json"), "utf8"));
await build();
const doc = page("staff/index.html");
const GROUPS = ["Administration", "Pre-K", "K–2", "3–5", "6–8", "Specials", "Support"];
const people = staffPeople().map((p) => p.data).filter((d) => GROUPS.includes(d.group));
const groupsInUse = GROUPS.filter((g) => people.some((p) => p.group === g));
const byOrderThenName = (a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || String(a.name).localeCompare(String(b.name));
const cardName = (card) => card.querySelector(".staff-card__name").text.trim();

test("the seven CMS groups are the directory's groups", () => {
  assert.deepEqual(strings.staff.groups, GROUPS);
});

test("one h2 per group that has people, in the fixed order, with a card per staff file", () => {
  const h2s = doc.querySelectorAll("main h2").map((h) => h.text.trim());
  assert.deepEqual(h2s, groupsInUse);
  assert.equal(doc.querySelectorAll(".staff-card").length, people.length);
  for (const group of groupsInUse) {
    const section = doc.querySelector(`[data-staff-group="${group}"]`);
    const expected = people.filter((p) => p.group === group).sort(byOrderThenName).map((p) => String(p.name).trim());
    assert.deepEqual(section.querySelectorAll(".staff-card").map(cardName), expected, `${group}: by order, then name`);
  }
});

test("title, intro and page header", () => {
  assert.equal(doc.querySelector("h1").text.trim(), "Our staff");
  assert.equal(doc.querySelector(".page-header__intro").text.trim(), strings.staff.intro);
});

test("a card shows the photo only with alt text and an existing file, else the initials circle", () => {
  for (const group of groupsInUse) {
    const cards = doc.querySelector(`[data-staff-group="${group}"]`).querySelectorAll(".staff-card");
    const expected = people.filter((p) => p.group === group).sort(byOrderThenName);
    expected.forEach((person, i) => {
      const card = cards[i];
      const circle = card.querySelector(".staff-card__initials");
      if (showsPhoto(person.photo, person.photo_alt)) {
        assert.equal(card.querySelector("img").getAttribute("alt"), String(person.photo_alt).trim(), person.name);
        assert.equal(circle, null, person.name);
      } else {
        assert.equal(card.querySelector("img"), null, person.name);
        assert.equal(circle.getAttribute("aria-hidden"), "true");
        assert.equal(circle.text.trim(), initials(person.name), person.name);
      }
    });
  }
  // The build warns about exactly the people whose photo is set but cannot show.
  const warned = new Set([...buildLog().matchAll(/\[staff\] \S*?([^/\s]+\.md):/g)].map((m) => m[1]));
  const expected = new Set(staffPeople().filter((p) => String(p.data.photo ?? "").trim() && !showsPhoto(p.data.photo, p.data.photo_alt)).map((p) => p.file));
  assert.deepEqual([...warned].sort(), [...expected].sort());
});

test("an email shows exactly for the people who have one", () => {
  const mailto = doc.querySelectorAll('a[href^="mailto:"]').map((a) => a.getAttribute("href")).sort();
  const expected = people.filter((p) => String(p.email ?? "").trim()).map((p) => `mailto:${String(p.email).trim()}`).sort();
  assert.deepEqual(mailto, expected);
});

test("filter buttons: hidden by default, All plus one per group, aria-pressed", () => {
  const bar = doc.querySelector("[data-staff-filter]");
  assert.ok(bar.hasAttribute("hidden"), "hidden until JS runs");
  const buttons = bar.querySelectorAll("button");
  assert.deepEqual(buttons.map((b) => b.text.trim()), [strings.staff.all, ...groupsInUse]);
  for (const b of buttons) assert.ok(["true", "false"].includes(b.getAttribute("aria-pressed")));
  assert.equal(buttons[0].getAttribute("aria-pressed"), "true");
  // A polite live region announces how many people the filter shows.
  const status = doc.querySelector("[data-staff-status]");
  assert.ok(status, "live region");
  assert.equal(status.getAttribute("aria-live"), "polite");
  assert.equal(status.text.trim(), "", "empty until the filter is used");
  assert.ok(status.getAttribute("data-count-one").includes("{n}"));
  assert.ok(status.getAttribute("data-count-other").includes("{n}"));
  assert.ok(status.getAttribute("data-count-all").includes("{n}"));
  // Without JavaScript every group is visible.
  assert.equal(doc.querySelectorAll("[data-staff-group][hidden]").length, 0);
});

test("staff menu entries point to /staff/", () => {
  const hrefs = page("index.html").querySelectorAll('a[href$="/school-poc/staff/"]');
  assert.ok(hrefs.length >= 2);
});

// ---- Editor-set email and photo (fixture people added through STAFF_FIXTURES_DIR) ----
await build({ name: "staff-fixtures", env: { STAFF_FIXTURES_DIR: "tests/fixtures/staff" } });
const fx = page("staff/index.html", "staff-fixtures");
const cardOf = (name) => fx.querySelectorAll(".staff-card").find((c) => cardName(c).includes(name));

test("email renders as a mailto link whose name starts with the visible address (WCAG 2.5.3)", () => {
  const a = cardOf("Fixture Email").querySelector('a[href^="mailto:"]');
  assert.equal(a.getAttribute("href"), "mailto:fixture.email@cps.edu");
  assert.ok(!a.hasAttribute("aria-label"), "no aria-label replacing the visible text");
  const hidden = a.querySelector(".visually-hidden");
  assert.ok(hidden, "the person's name is added as visually hidden text");
  const visible = a.text.replace(hidden.text, "").trim();
  assert.equal(visible, "fixture.email@cps.edu");
  const name = a.text.replace(/\s+/g, " ").trim();
  assert.ok(name.startsWith("fixture.email@cps.edu"), name);
  assert.match(name, /Ms\. Fixture Email/);
});

test("photo with alt renders a 1:1 image and no initials circle", () => {
  const card = cardOf("Fixture Photo");
  assert.ok(card.querySelector("img.staff-card__photo, picture img"));
  assert.equal(card.querySelector("img").getAttribute("alt"), "Ms. Fixture Photo smiling");
  assert.equal(card.querySelector(".staff-card__initials"), null);
});

test("photo without alt or with a missing file falls back to initials and warns", () => {
  for (const name of ["Fixture NoAlt", "Fixture Missing"]) {
    const card = cardOf(name);
    assert.ok(card.querySelector(".staff-card__initials"), name);
    assert.equal(card.querySelector("img"), null, name);
  }
  const log = buildLog("staff-fixtures");
  assert.match(log, /\[staff\].*photo-without-alt\.md.*no photo_alt/);
  assert.match(log, /\[staff\].*photo-missing-file\.md.*photo file not found/);
  assert.doesNotMatch(log, /\[staff\].*(email|photo-with-alt|order-[a-z]+)\.md/, "no warning for people without a photo or with a good one");
});

test("within a group: by order, ties by name, people without an order last; initials skip the honorific", () => {
  const support = fx.querySelector('[data-staff-group="Support"]').querySelectorAll(".staff-card");
  const names = support.map(cardName).filter((n) => /Fixture/.test(n));
  assert.deepEqual(names, ["Mr. Fixture Abe", "Ms. Fixture Zed", "Ms. Fixture Aaron"]);
  assert.equal(cardOf("Mr. Fixture Abe").querySelector(".staff-card__initials").text.trim(), "FA");
});
