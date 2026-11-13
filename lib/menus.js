// School meal menus from CPS's MealViewer (architecture spec section 5; issue #3).
// CPS publishes every school's breakfast, lunch and snack menus on MealViewer. The site reads
// the school's menu for this week and next at build time, through the same cached fetcher as
// the Google Calendar feed, and keeps a cleaned-up copy:
//   days: [{ date: "YYYY-MM-DD", meals: [Meal] }]   (a school day with no meals = no menu posted)
//   Meal: { key, audience, meal, name, note, groups: [{ key, items }], items }
import { readFileSync } from "node:fs";
import path from "node:path";
import { chicagoDay } from "./events.js";

const API = "https://api.mealviewer.com/api/v4/school";

// ---------- Dates (calendar days as "YYYY-MM-DD"; weeks run Monday to Friday) ----------

/** 0 = Sunday … 6 = Saturday, for a calendar day. */
export function weekday(day) {
  return new Date(`${day}T12:00:00Z`).getUTCDay();
}

export function addDays(day, n) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The Monday of the week a day falls in (Saturday and Sunday belong to the week before). */
export function mondayOf(day) {
  return addDays(day, -((weekday(day) + 6) % 7));
}

/** The days the site asks MealViewer for: Monday of this week to Friday of next week. */
export function menuWindow(now) {
  const start = mondayOf(chicagoDay(now));
  return { start, end: addDays(start, 11) };
}

/** MealViewer's menu address for a school lookup (e.g. "610355-51073") and a range of days. */
export function mealViewerUrl(school, start, end) {
  const us = (day) => `${day.slice(5, 7)}-${day.slice(8, 10)}-${day.slice(0, 4)}`;
  return `${API}/${encodeURIComponent(school)}/${us(start)}/${us(end)}/0`;
}

// ---------- Cleaning up the feed ----------

// The feed mixes dishes with section headers ("FEATURED ENTREES", "CHOICE OF MILK"), notes
// ("*HOLIDAY MEAL!*"), sauces and the milk that comes with every meal. Families want the dishes.
const isNote = (name) => /^\*.*\*$/.test(name);
const isHeader = (name) => !/[a-z]/.test(name);
const CONDIMENT = /\b(sauce|dressing|ketchup|mustard|mayonnaise|margarine|jelly|syrup|salsa verde)\b/i;

function cleanName(value) {
  return String(value ?? "")
    .replace(/\s*\((local)\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function noteText(name) {
  const t = name.replace(/^\*+|\*+$/g, "").trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// "K-8 Lunch" -> { audience: "k8", meal: "lunch" }; "Pre-K Snack" -> prek snack; and so on.
export function classifyBlock(blockName) {
  const name = String(blockName ?? "");
  const audience = /pre-?\s?k/i.test(name) ? "prek" : /after\s*-?school/i.test(name) ? "afterSchool" : "k8";
  const meal = /breakfast/i.test(name) ? "breakfast" : /lunch/i.test(name) ? "lunch" : /snack/i.test(name) ? "snack" : "other";
  return { audience, meal, key: `${audience}-${meal}` };
}

const GROUP_OF = { VEGETABLE: "vegetables", VEGETABLES: "vegetables", FRUIT: "fruit", FRUITS: "fruit", MILK: "milk", CONDIMENTS: "condiments", CONDIMENT: "condiments" };
const GROUP_ORDER = ["main", "vegetables", "fruit"];
const MEAL_ORDER = ["k8-breakfast", "prek-breakfast", "k8-lunch", "prek-lunch", "prek-snack", "k8-snack", "afterSchool-snack"];

function mealFrom(block) {
  const { audience, meal, key } = classifyBlock(block?.blockName);
  const foods = [];
  for (const line of block?.cafeteriaLineList?.data ?? []) {
    for (const food of line?.foodItemList?.data ?? []) foods.push(food);
  }
  let note = "";
  const seen = new Set();
  const groups = new Map();
  const items = [];
  // Breakfast and lunch come grouped (main, vegetables, fruit) without milk and sauces;
  // a snack is a short list shown as it is.
  const grouped = meal === "breakfast" || meal === "lunch";
  for (const food of foods) {
    const name = cleanName(food?.item_Name);
    if (!name) continue;
    if (isNote(name)) { note = note || noteText(name); continue; }
    if (isHeader(name)) continue;
    if (seen.has(name.toLowerCase())) continue;
    const group = GROUP_OF[String(food?.item_Type ?? "").trim().toUpperCase()] ?? "main";
    if (grouped && (group === "milk" || group === "condiments" || CONDIMENT.test(name))) continue;
    seen.add(name.toLowerCase());
    items.push(name);
    if (grouped) {
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(name);
    }
  }
  return {
    key, audience, meal,
    name: String(block?.blockName ?? "").trim(),
    note,
    groups: grouped ? GROUP_ORDER.filter((g) => groups.has(g)).map((g) => ({ key: g, items: groups.get(g) })) : [],
    items,
  };
}

const mealRank = (m) => {
  const i = MEAL_ORDER.indexOf(m.key);
  return i === -1 ? MEAL_ORDER.length : i;
};

/**
 * MealViewer's school response -> days in date order, each with its meals in a fixed order.
 * Blacked-out blocks and blocks with no dishes are left out. Never throws.
 */
export function parseMenus(json) {
  const days = [];
  for (const schedule of json?.menuSchedules ?? []) {
    const date = String(schedule?.dateInformation?.dateFull ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const meals = (schedule?.menuBlocks ?? [])
      .filter((block) => block && !block.blackedOut)
      .map(mealFrom)
      .filter((meal) => meal.items.length > 0)
      .sort((a, b) => mealRank(a) - mealRank(b));
    days.push({ date, meals });
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

const looksLikeMenus = (body) => {
  try {
    return Array.isArray(JSON.parse(body)?.menuSchedules);
  } catch {
    return false;
  }
};
export { looksLikeMenus };

// ---------- What the pages show ----------

/** School days (days with meals) from `today` on: the homepage card shows the first. */
export function menuDaysFrom(days, today) {
  return (days || []).filter((d) => d.date >= today && d.meals.length > 0);
}

/**
 * The homepage card: the lunch (MealViewer's "K-8 Lunch", which Pre-K eats too) and every
 * Pre-K meal (the Pre-K snack), for each school day from `today` on that has at least one of them.
 */
export function homeMenuDays(days, today) {
  return menuDaysFrom(days, today)
    .map((d) => ({ date: d.date, meals: d.meals.filter((m) => m.key === "k8-lunch" || m.audience === "prek") }))
    .filter((d) => d.meals.length > 0);
}

/**
 * Weeks (Monday to Friday) that end on or after `today` and have at least one meal, each with
 * all five weekdays (a weekday with no meals has `meals: []`). The menu page shows the first.
 */
export function menuWeeks(days, today) {
  const byDate = new Map((days || []).map((d) => [d.date, d]));
  const mondays = [...new Set((days || []).map((d) => mondayOf(d.date)))].sort();
  const weeks = [];
  for (const start of mondays) {
    const end = addDays(start, 4);
    if (end < today) continue;
    const week = { start, end, days: [] };
    for (let i = 0; i < 5; i++) {
      const date = addDays(start, i);
      week.days.push(byDate.get(date) ?? { date, meals: [] });
    }
    if (week.days.some((d) => d.meals.length > 0)) weeks.push(week);
  }
  return weeks;
}

// ---------- Loading ----------

/**
 * Where the menus come from, in order:
 *   1. `file` (MENU_JSON_FILE, used by tests)  -> source "file"
 *   2. MealViewer for `school`, fresh (1h)      -> source "live"
 *   3. on fetch error, the last cached copy     -> source "cache"
 *   4. nothing (no school set, or no copy)      -> { days: [], source: "none" } with a warning
 * Never throws: a menu problem must not fail the build; the menu sections hide instead.
 */
export async function loadMenus({ file, school, fetchText, now, logger = console, root = process.cwd() } = {}) {
  const none = { days: [], source: "none" };
  const warn = (message) => {
    try {
      logger.warn(`[menus] ${message}`);
    } catch {
      // A broken logger must not fail the build either.
    }
  };
  const result = (body, source) => {
    if (!looksLikeMenus(body)) throw new Error("not a MealViewer menu");
    return { days: parseMenus(JSON.parse(body)), source };
  };

  try {
    if (file) {
      try {
        return result(readFileSync(path.resolve(root, file), "utf8"), "file");
      } catch (e) {
        warn(`could not read ${file} (${e.message}); showing no menu.`);
        return none;
      }
    }
    const id = String(school ?? "").trim();
    if (!id) {
      warn("no MealViewer school set (site.json mealViewerSchool); showing no menu.");
      return none;
    }
    const { start, end } = menuWindow(now);
    const url = mealViewerUrl(id, start, end);
    try {
      return result(await fetchText(url, "1h"), "live");
    } catch (e) {
      warn(`could not fetch the menu (${e.message}); using the last cached copy.`);
    }
    try {
      return result(await fetchText(url, "*"), "cache");
    } catch (e) {
      warn(`no cached copy of this week's menu (${e.message}); showing no menu.`);
      return none;
    }
  } catch (e) {
    warn(`unexpected menu error (${e.message}); showing no menu.`);
    return none;
  }
}
