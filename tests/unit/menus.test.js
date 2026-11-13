// School meal menus from MealViewer (lib/menus.js; issue #3).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseMenus, classifyBlock, menuWindow, mealViewerUrl, mondayOf, homeMenuDays, menuWeeks,
  menuDaysFrom, loadMenus, looksLikeMenus,
} from "../../lib/menus.js";

const body = readFileSync(new URL("../fixtures/menus.json", import.meta.url), "utf8");
const days = parseMenus(JSON.parse(body));
const on = (date) => days.find((d) => d.date === date);
const meal = (date, key) => on(date).meals.find((m) => m.key === key);
const quiet = { warn() {} };

test("blocks are classified by audience and meal", () => {
  assert.deepEqual(classifyBlock("K-8 GNG Breakfast"), { audience: "k8", meal: "breakfast", key: "k8-breakfast" });
  assert.deepEqual(classifyBlock("K-8 Lunch"), { audience: "k8", meal: "lunch", key: "k8-lunch" });
  assert.deepEqual(classifyBlock("Pre-K Snack"), { audience: "prek", meal: "snack", key: "prek-snack" });
  assert.deepEqual(classifyBlock("PreK Lunch"), { audience: "prek", meal: "lunch", key: "prek-lunch" });
  assert.deepEqual(classifyBlock("After School Snack"), { audience: "afterSchool", meal: "snack", key: "afterSchool-snack" });
});

test("every fixture day is kept in date order; a day off has no meals", () => {
  assert.equal(days.length, 12);
  assert.equal(days[0].date, "2026-11-09");
  assert.equal(days.at(-1).date, "2026-11-20");
  assert.deepEqual(on("2026-11-11").meals, []);
  assert.deepEqual(on("2026-11-14").meals, []);
});

test("meals come in a fixed order: breakfast, lunch, Pre-K snack, after-school snack", () => {
  assert.deepEqual(on("2026-11-13").meals.map((m) => m.key), ["k8-breakfast", "k8-lunch", "prek-snack", "afterSchool-snack"]);
});

test("lunch is grouped into main, vegetables and fruit, without headers, milk, sauces or '(Local)'", () => {
  assert.deepEqual(meal("2026-11-13", "k8-lunch").groups, [
    { key: "main", items: ["Cheese Pizzadilla", "Turkey Chef Salad w/ Dinner Roll & Ranch", "SBJ Sandwich", "WBJ Sandwich"] },
    { key: "vegetables", items: ["Cajun Broccoli", "Fresh Green Pepper Strips"] },
    { key: "fruit", items: ["Dried Cranberries", "Fresh Apple"] },
  ]);
  const tuesday = meal("2026-11-10", "k8-lunch").items;
  for (const gone of ["Ketchup", "Mayonnaise", "Mustard", "CPS Sweet Heat Sauce", "Ranch Dressing", "BBQ Sauce", "Skim Milk", "FEATURED ENTREES"]) {
    assert.ok(!tuesday.includes(gone), gone);
  }
});

test("a starred line becomes the meal's note, and repeats are dropped", () => {
  assert.equal(meal("2026-11-12", "k8-lunch").note, "Holiday meal!");
  assert.equal(meal("2026-11-18", "k8-lunch").note, "Finger food day!");
  const items = meal("2026-11-18", "k8-lunch").items;
  assert.equal(items.filter((i) => i === "SBJ Sandwich").length, 1);
});

test("a snack is a plain list kept as it is (milk and dips included)", () => {
  const snack = meal("2026-11-12", "prek-snack");
  assert.deepEqual(snack.groups, []);
  assert.deepEqual(snack.items, ["Blueberry Muffin", "Skim Milk"]);
  assert.deepEqual(meal("2026-11-19", "prek-snack").items, ["Cheez-It Crackers", "Ranch Dressing", "Fresh Cucumber Slices"]);
});

test("parseMenus never throws on junk", () => {
  assert.deepEqual(parseMenus(null), []);
  assert.deepEqual(parseMenus({ menuSchedules: [{}, { dateInformation: { dateFull: "nope" } }] }), []);
  assert.deepEqual(parseMenus({ menuSchedules: [{ dateInformation: { dateFull: "2026-11-13T00:00:00" }, menuBlocks: [null, { blockName: "K-8 Lunch", blackedOut: true }] }] }), [{ date: "2026-11-13", meals: [] }]);
});

test("the fetch window runs from this Monday to next Friday, in Chicago", () => {
  assert.deepEqual(menuWindow(new Date("2026-11-13T18:00:00Z")), { start: "2026-11-09", end: "2026-11-20" });
  // Late Sunday evening in Chicago is already Monday in UTC: still the week before.
  assert.deepEqual(menuWindow(new Date("2026-11-16T04:30:00Z")), { start: "2026-11-09", end: "2026-11-20" });
  assert.equal(mondayOf("2026-11-09"), "2026-11-09");
  assert.equal(mondayOf("2026-11-15"), "2026-11-09");
  assert.equal(mealViewerUrl("610355-51073", "2026-11-09", "2026-11-20"),
    "https://api.mealviewer.com/api/v4/school/610355-51073/11-09-2026/11-20-2026/0");
});

test("homepage days: today on, school days only, K–8 lunch and Pre-K meals only", () => {
  const home = homeMenuDays(days, "2026-11-13");
  assert.deepEqual(home.map((d) => d.date), ["2026-11-13", "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"]);
  assert.deepEqual(home[0].meals.map((m) => m.key), ["k8-lunch", "prek-snack"]);
  assert.equal(homeMenuDays(days, "2026-11-14")[0].date, "2026-11-16");
  assert.deepEqual(homeMenuDays(days, "2026-11-21"), []);
  assert.deepEqual(menuDaysFrom(days, "2026-11-11").map((d) => d.date)[0], "2026-11-12");
});

test("weeks: Monday to Friday with all five days; past weeks dropped", () => {
  const weeks = menuWeeks(days, "2026-11-13");
  assert.deepEqual(weeks.map((w) => [w.start, w.end]), [["2026-11-09", "2026-11-13"], ["2026-11-16", "2026-11-20"]]);
  assert.deepEqual(weeks[0].days.map((d) => d.date), ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13"]);
  assert.deepEqual(weeks[0].days[2].meals, []);
  assert.equal(menuWeeks(days, "2026-11-14")[0].start, "2026-11-16");
  assert.deepEqual(menuWeeks(days, "2026-11-21"), []);
});

test("looksLikeMenus accepts MealViewer JSON only", () => {
  assert.ok(looksLikeMenus(body));
  assert.ok(!looksLikeMenus("<html>sign in</html>"));
  assert.ok(!looksLikeMenus('{"message":"No HTTP resource"}'));
});

const now = new Date("2026-11-13T18:00:00Z");

test("loadMenus: the env file wins", async () => {
  const r = await loadMenus({ file: "tests/fixtures/menus.json", school: "x", fetchText: () => { throw new Error("must not fetch"); }, now, logger: quiet });
  assert.equal(r.source, "file");
  assert.equal(r.days.length, 12);
});

test("loadMenus: the school's two-week menu is fetched fresh and marked live", async () => {
  const asked = [];
  const r = await loadMenus({ school: "610355-51073", fetchText: async (url, d) => { asked.push([url, d]); return body; }, now, logger: quiet });
  assert.equal(r.source, "live");
  assert.deepEqual(asked, [["https://api.mealviewer.com/api/v4/school/610355-51073/11-09-2026/11-20-2026/0", "1h"]]);
});

test("loadMenus: on fetch error the cached copy is used", async () => {
  const warnings = [];
  const r = await loadMenus({
    school: "s", now, logger: { warn: (m) => warnings.push(m) },
    fetchText: async (url, d) => { if (d === "1h") throw new Error("offline"); return body; },
  });
  assert.equal(r.source, "cache");
  assert.match(warnings[0], /^\[menus\] could not fetch the menu \(offline\)/);
});

test("loadMenus: no school, no copy or a broken file -> no menu with a warning, never throws", async () => {
  const fail = async () => { throw new Error("offline"); };
  assert.deepEqual(await loadMenus({ school: "", fetchText: fail, now, logger: quiet }), { days: [], source: "none" });
  assert.deepEqual(await loadMenus({ school: "s", fetchText: fail, now, logger: quiet }), { days: [], source: "none" });
  assert.deepEqual(await loadMenus({ school: "s", fetchText: async () => "<html>", now, logger: quiet }), { days: [], source: "none" });
  assert.deepEqual(await loadMenus({ file: "nope.json", now, logger: quiet }), { days: [], source: "none" });
  assert.deepEqual(await loadMenus({ school: "s", fetchText: fail, now, logger: { warn() { throw new Error("x"); } } }), { days: [], source: "none" });
});
