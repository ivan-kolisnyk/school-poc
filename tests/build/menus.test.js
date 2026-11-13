// Lunch menu: homepage card and the week page (issue #3), built from the fixture MealViewer
// menu (tests/fixtures/menus.json: Courtenay, Nov 9–20 2026). SITE_NOW is Friday Nov 13.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, page, buildLog } from "../helpers/build.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const strings = JSON.parse(readFileSync(path.join(root, "src/_settings/strings.en.json"), "utf8"));
const site = JSON.parse(readFileSync(path.join(root, "src/_data/site.json"), "utf8"));
const text = (el) => el.text.replace(/\s+/g, " ").trim();
const PREFIX = "/school-poc";

await build();
await build({ name: "menu-weekend", env: { SITE_NOW: "2026-11-14T10:00:00-06:00" } });
await build({ name: "no-menu", env: { MENU_JSON_FILE: "tests/fixtures/menus-empty.json" } });

const card = (variant) => page("index.html", variant).querySelector('main [data-home-section="menu"]');
const shown = (box, selector) => box.querySelectorAll(selector).filter((el) => !el.hasAttribute("hidden"));
const week = (variant) => page("families/lunch-menu/index.html", variant).querySelector("main [data-meals]");

test("homepage: the lunch card comes after the pride band, titled and linked to the week page", () => {
  const c = card();
  assert.ok(c, "menu section exists");
  assert.equal(c.getAttribute("data-meals-source"), "file");
  assert.equal(text(c.querySelector("h2 [data-meals-heading]:not([hidden])")), strings.menu.heading);
  const more = c.querySelector(".section-head__more");
  assert.equal(more.getAttribute("href"), `${PREFIX}/families/lunch-menu/`);
  assert.equal(text(more), strings.menu.seeWeek);
});

test("homepage: titled Today's menu; lunch is labelled Pre-K–8 and the snack Pre-K", () => {
  assert.equal(strings.menu.heading, "Today's menu");
  assert.equal(text(card().querySelector("h2 [data-meals-heading]:not([hidden])")), "Today's menu");
  assert.ok(card().querySelector('h2 [data-meals-heading="next"][hidden]'));
  assert.deepEqual(shown(card(), "[data-meals-day]")[0].querySelectorAll("h3.meal__title").map(text), ["Lunch · Pre-K–8", "Snack · Pre-K"]);
  assert.ok(card().classList.contains("home-menu"), "styled as the gold band (pages.css .home-menu)");
});

test("homepage: today's lunch and Pre-K snack show; later school days wait hidden", () => {
  const c = card();
  const visible = shown(c, "[data-meals-day]");
  assert.deepEqual(visible.map((d) => d.getAttribute("data-meals-day")), ["2026-11-13"]);
  assert.deepEqual(c.querySelectorAll("[data-meals-day]").map((d) => d.getAttribute("data-meals-day")),
    ["2026-11-13", "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"]);
  const today = visible[0];
  assert.equal(text(today.querySelector(".menu-today__date")), "Friday, Nov 13");
  assert.deepEqual(today.querySelectorAll("h3.meal__title").map(text), [strings.menu.meals["k8-lunch"], strings.menu.meals["prek-snack"]]);
  const lunch = today.querySelectorAll(".meal")[0];
  assert.deepEqual(lunch.querySelectorAll(".meal__group").map((g) => [text(g.querySelector("dt")), text(g.querySelector("dd"))]), [
    ["Main", "Cheese Pizzadilla, Turkey Chef Salad w/ Dinner Roll & Ranch, SBJ Sandwich, WBJ Sandwich"],
    ["Vegetables", "Cajun Broccoli, Fresh Green Pepper Strips"],
    ["Fruit", "Dried Cranberries, Fresh Apple"],
  ]);
  assert.equal(text(today.querySelectorAll(".meal")[1].querySelector(".meal__items")), "Round Tortilla Chips, Black Bean Salsa");
});

test("homepage on a Saturday shows Monday's menu", () => {
  const visible = shown(card("menu-weekend"), "[data-meals-day]");
  assert.deepEqual(visible.map((d) => d.getAttribute("data-meals-day")), ["2026-11-16"]);
  assert.equal(text(visible[0].querySelector(".menu-today__date")), "Monday, Nov 16");
  const title = card("menu-weekend").querySelector("h2 [data-meals-heading]:not([hidden])");
  assert.equal(text(title), strings.menu.headingNext);
  assert.equal(strings.menu.headingNext, "Next school day's menu");
});

test("homepage with no menu leaves the section out, heading included, and warns nothing fatal", () => {
  assert.equal(card("no-menu"), null);
  const order = page("index.html", "no-menu").querySelectorAll("main [data-home-section]").map((el) => el.getAttribute("data-home-section"));
  assert.ok(!order.includes("menu"));
});

test("week page: a Families page with one h1, the breadcrumb and this week's five days", () => {
  const doc = page("families/lunch-menu/index.html");
  assert.equal(text(doc.querySelector("h1")), "Lunch menu");
  assert.equal(doc.querySelectorAll("h1").length, 1);
  const weeks = shown(week(), ".menu-week");
  assert.equal(weeks.length, 1);
  assert.equal(text(weeks[0].querySelector("h2")), "Week of November 9, 2026");
  assert.deepEqual(weeks[0].querySelectorAll("h3").map(text),
    ["Monday, Nov 9", "Tuesday, Nov 10", "Wednesday, Nov 11", "Thursday, Nov 12", "Friday, Nov 13"]);
  assert.equal(week().querySelectorAll(".menu-week").length, 2, "next week waits hidden");
});

test("week page: every meal of the day, and a day off says no menu is posted", () => {
  const days = shown(week(), ".menu-week")[0].querySelectorAll(".menu-day");
  assert.deepEqual(days[0].querySelectorAll("h4.meal__title").map(text), [
    strings.menu.meals["k8-breakfast"], strings.menu.meals["k8-lunch"], strings.menu.meals["prek-snack"], strings.menu.meals["afterSchool-snack"],
  ]);
  assert.equal(text(days[2].querySelector(".menu-day__none")), strings.menu.noMenuDay);
  assert.equal(text(days[3].querySelector(".meal__note")), "Holiday meal!");
});

test("week page links to the full menu on MealViewer as an external link", () => {
  const links = week().querySelectorAll(".menu-full a");
  assert.equal(links.length, 1);
  assert.equal(links[0].getAttribute("href"), site.links.lunchMenu);
  assert.ok(links[0].querySelector("svg.icon-external-link"));
  assert.ok(week().querySelector("[data-meals-empty][hidden]"), "the empty line waits hidden");
});

test("week page on a Saturday shows the coming week", () => {
  const weeks = shown(week("menu-weekend"), ".menu-week");
  assert.equal(text(weeks[0].querySelector("h2")), "Week of November 16, 2026");
});

test("week page with no menu shows the empty line linking to MealViewer", () => {
  const box = week("no-menu");
  assert.equal(box.querySelectorAll(".menu-week").length, 0);
  const empty = box.querySelector(".menu-empty");
  assert.equal(empty.hasAttribute("hidden"), false);
  assert.equal(text(empty).replace(/\s+\.$/, "."), strings.menu.empty); // the icon sits before the full stop
  assert.equal(empty.querySelector("a").getAttribute("href"), site.links.lunchMenu);
  assert.doesNotMatch(buildLog("no-menu"), /\[menus\]/, "an empty but valid menu is not an error");
});
