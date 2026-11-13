// Upcoming events from the school's Google Calendar (DESIGN.md 10.9; architecture spec 5).
// Source order: CALENDAR_ICS_FILE (tests) -> site.calendarIcs fetched (cached 1h) ->
// last cached copy if the fetch fails -> sample-calendar.ics while no feed URL is set -> none.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { feedFetcher, loadCalendar } from "../../lib/events.js";
import now from "./now.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const fetchText = feedFetcher(path.join(root, ".cache"));

export default async function () {
  const site = JSON.parse(readFileSync(path.join(here, "site.json"), "utf8"));
  return loadCalendar({
    file: process.env.CALENDAR_ICS_FILE,
    url: site.calendarIcs,
    sampleFile: path.join(here, "sample-calendar.ics"),
    fetchText,
    now: now(),
    root,
  });
}
