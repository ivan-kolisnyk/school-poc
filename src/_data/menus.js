// School meal menus from CPS's MealViewer (lib/menus.js; architecture spec section 5).
// Source order: MENU_JSON_FILE (tests) -> MealViewer for site.mealViewerSchool (cached 1h) ->
// last cached copy if the fetch fails -> none (the homepage card hides; the menu page says so).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { feedFetcher } from "../../lib/events.js";
import { loadMenus, looksLikeMenus } from "../../lib/menus.js";
import now from "./now.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const fetchText = feedFetcher(path.join(root, ".cache"), {
  validate: looksLikeMenus,
  invalidMessage: "response is not a MealViewer menu",
});

export default async function () {
  const site = JSON.parse(readFileSync(path.join(here, "site.json"), "utf8"));
  return loadMenus({
    file: process.env.MENU_JSON_FILE,
    school: site.mealViewerSchool,
    fetchText,
    now: now(),
    root,
  });
}
