// Google Calendar events (DESIGN.md 10.9; architecture spec section 5).
// Parses the calendar's public iCal feed, expands recurring events and returns the upcoming ones.
import { readFileSync } from "node:fs";
import path from "node:path";
import ical from "node-ical";
import { RemoteAssetCache } from "@11ty/eleventy-fetch";
import { chicagoLocalToDate, formatDate, formatTime } from "./dates.js";

const TZ = "America/Chicago";
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @typedef {{ id: string, title: string, start: Date, end: Date, allDay: boolean,
 *             location: string, description: string }} Event
 */

// node-ical gives a plain string, or { val, params } when the property carried parameters.
function text(value) {
  if (value == null) return "";
  if (typeof value === "object" && "val" in value) return String(value.val ?? "");
  return String(value);
}

// Google Calendar descriptions may hold HTML; the site shows plain text.
function plain(value) {
  return text(value)
    .replace(/<br\s*\/?>|<\/(p|div|li)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const isoDayFmt = new Map();
function isoDay(date, timeZone) {
  if (!isoDayFmt.has(timeZone)) {
    isoDayFmt.set(timeZone, new Intl.DateTimeFormat("en-CA", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    }));
  }
  return isoDayFmt.get(timeZone).format(date);
}

/** "YYYY-MM-DD" of an instant in Chicago. */
export function chicagoDay(date) {
  return isoDay(date, TZ);
}

// The calendar date of an all-day value. node-ical builds floating dates (VALUE=DATE, no TZID)
// at local midnight of the build machine, and zoned ones in their own zone.
function calendarDay(date) {
  if (date.tz) {
    try {
      return isoDay(date, date.tz);
    } catch {
      // Unknown zone name: fall through to the local reading.
    }
  }
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(day, n) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const cancelled = (ev) => text(ev?.status).toUpperCase() === "CANCELLED";

function parse(icsText) {
  if (typeof icsText !== "string" || !icsText.trim()) return {};
  try {
    return ical.sync.parseICS(icsText) || {};
  } catch {
    return {};
  }
}

/**
 * Upcoming events, sorted by start. An event is upcoming while its end is after `now`
 * (so an event in progress is kept) and it starts within `days` of `now`.
 * @param {string} icsText
 * @param {Date} now
 * @param {{ days?: number, limit?: number }} [opts]
 * @returns {Event[]}
 */
export function upcomingEvents(icsText, now, { days = 365, limit } = {}) {
  const horizon = new Date(now.getTime() + days * DAY_MS);
  const out = [];

  for (const ev of Object.values(parse(icsText))) {
    if (!ev || ev.type !== "VEVENT" || !(ev.start instanceof Date)) continue;
    if (Number.isNaN(ev.start.getTime())) continue;
    // RECURRENCE-ID overrides are applied through their base event's expansion.
    if (ev.recurrenceid) continue;
    if (cancelled(ev)) continue;

    const allDay = ev.datetype === "date" || ev.start.dateOnly === true;
    const length = ev.end instanceof Date ? Math.max(0, ev.end - ev.start) : 0;
    let instances;
    try {
      instances = ical.expandRecurringEvent(ev, {
        // Reach back far enough to catch an instance that started earlier and is still on,
        // plus two days for floating all-day dates read in the build machine's zone.
        from: new Date(now.getTime() - length - 2 * DAY_MS),
        to: horizon,
      });
    } catch {
      continue; // A broken or runaway rule drops that event, never the build.
    }

    for (const inst of instances) {
      const source = inst.event || ev;
      if (cancelled(source)) continue;
      let start;
      let end;
      if (allDay) {
        const first = calendarDay(inst.start);
        let after = inst.end instanceof Date ? calendarDay(inst.end) : addDays(first, 1);
        if (after <= first) after = addDays(first, 1);
        start = chicagoLocalToDate(first);
        end = chicagoLocalToDate(after);
      } else {
        start = new Date(inst.start);
        end = inst.end instanceof Date && inst.end > inst.start ? new Date(inst.end) : start;
      }
      const ongoing = end > now || (end.getTime() === start.getTime() && start >= now);
      if (!ongoing || start > horizon) continue;
      out.push({
        id: `${text(ev.uid) || text(inst.summary)}@${start.toISOString()}`,
        title: plain(inst.summary ?? source.summary) || "",
        start,
        end,
        allDay,
        location: plain(source.location),
        description: plain(source.description),
      });
    }
  }

  out.sort((a, b) => a.start - b.start || a.title.localeCompare(b.title));
  return typeof limit === "number" ? out.slice(0, Math.max(0, limit)) : out;
}

/**
 * The time line under an event title: "8:30 am – 9:30 am", the all-day label, or a date range
 * in list style for an event over several days.
 */
export function eventWhen(event, allDayLabel) {
  const { start, end, allDay } = event;
  if (allDay) {
    const last = new Date(end.getTime() - 1);
    if (chicagoDay(last) <= chicagoDay(start)) return allDayLabel;
    return `${formatDate(start, "list")} – ${formatDate(last, "list")}`;
  }
  if (!(end > start)) return formatTime(start);
  if (chicagoDay(end) === chicagoDay(start)) return `${formatTime(start)} – ${formatTime(end)}`;
  return `${formatDate(start, "list")}, ${formatTime(start)} – ${formatDate(end, "list")}, ${formatTime(end)}`;
}

/**
 * Events that start within `days` of `now` (in-progress ones included). Lets a page show a
 * shorter window than the events data holds, e.g. `days: 90` on /events/.
 */
export function eventsWithin(events, now, days) {
  const horizon = new Date(new Date(now).getTime() + days * DAY_MS);
  return (events || []).filter((event) => event.start <= horizon);
}

/** Events grouped by the Chicago month they start in, order kept. */
export function groupByMonth(events) {
  const groups = [];
  for (const event of events || []) {
    const key = chicagoDay(event.start).slice(0, 7);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = { key, label: formatDate(event.start, "monthYear"), items: [] };
      groups.push(group);
    }
    group.items.push(event);
  }
  return groups;
}

/**
 * The feed fetcher used by the events data, backed by Eleventy Fetch's cache in `cacheDir`.
 * fetchText(url, "1h") resolves only with a copy at most an hour old (fetching if needed);
 * fetchText(url, "*") resolves with whatever copy is cached and never goes to the network.
 * A response is accepted, and cached, only if it is an iCalendar file: a private Google
 * Calendar answers 200 with an HTML sign-in page, which must never replace the good copy.
 * Eleventy Fetch quietly serves an expired copy when a request fails; here that counts as a
 * failure, so loadCalendar can tell a fresh ("live") copy from the cached fallback.
 */
export function feedFetcher(cacheDir, { timeoutMs = 30000 } = {}) {
  // One cache object per URL (as Eleventy Fetch's own Fetch() keeps), so a copy saved earlier
  // in this process is seen by the later cached-copy lookup.
  const assets = new Map();
  const assetFor = (url) => {
    if (!assets.has(url)) {
      const entry = { lastError: null };
      // A function source lets us check the body before Eleventy Fetch saves it.
      const source = async () => {
        entry.lastError = null;
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const body = await res.text();
          if (!looksLikeIcs(body)) {
            throw new Error("response is not an iCalendar file (is the calendar public?)");
          }
          return body;
        } catch (e) {
          entry.lastError = e;
          throw e;
        }
      };
      entry.asset = new RemoteAssetCache(source, cacheDir, {
        type: "text", duration: "1h", requestId: url, formatUrlForDisplay: () => url,
      });
      assets.set(url, entry);
    }
    return assets.get(url);
  };
  return async function fetchText(url, duration) {
    const record = assetFor(url);
    const { asset } = record;
    if (duration === "*" && !asset.isCacheValid("*")) throw new Error("nothing cached");
    const body = await asset.fetch({ duration });
    if (!asset.isCacheValid(duration)) {
      const why = record.lastError ? record.lastError.message : "feed unreachable";
      throw new Error(`${why}; only an expired copy is cached`);
    }
    return body;
  };
}

const looksLikeIcs = (body) => typeof body === "string" && /BEGIN:VCALENDAR/.test(body);

function readIcs(file, root) {
  const body = readFileSync(path.resolve(root, file), "utf8");
  if (!looksLikeIcs(body)) throw new Error("not an iCalendar file");
  return body;
}

/**
 * Where the events come from, in order:
 *   1. `file` (CALENDAR_ICS_FILE, used by tests)
 *   2. `url` fetched fresh (cache up to 1h)  -> source "live"
 *   3. on fetch error, the last cached copy -> source "cache"
 *   4. `sampleFile` when no URL is set      -> source "file"
 *   5. nothing                              -> { items: [], source: "none" } with a warning
 * Never throws: a calendar problem must not fail the build.
 * `fetchText(url, duration)` resolves the body, or rejects when it has no copy of that age.
 */
export async function loadCalendar({
  file, url, sampleFile, fetchText, now, days, logger = console, root = process.cwd(),
} = {}) {
  const none = { items: [], source: "none" };
  const result = (body, source) => ({ items: upcomingEvents(body, now, { days }), source });
  const warn = (message) => {
    try {
      logger.warn(`[events] ${message}`);
    } catch {
      // A broken logger must not fail the build either.
    }
  };

  try {
    if (file) {
      try {
        return result(readIcs(file, root), "file");
      } catch (e) {
        warn(`could not read ${file} (${e.message}); showing no events.`);
        return none;
      }
    }

    if (url) {
      try {
        const body = await fetchText(url, "1h");
        if (!looksLikeIcs(body)) throw new Error("response is not an iCalendar file");
        return result(body, "live");
      } catch (e) {
        warn(`could not fetch the calendar feed (${e.message}); using the last cached copy.`);
      }
      try {
        const body = await fetchText(url, "*");
        if (!looksLikeIcs(body)) throw new Error("cached copy is not an iCalendar file");
        return result(body, "cache");
      } catch (e) {
        warn(`no cached copy of the calendar feed (${e.message}); showing no events.`);
        return none;
      }
    }

    if (sampleFile) {
      try {
        return result(readIcs(sampleFile, root), "file");
      } catch (e) {
        warn(`could not read the sample calendar ${sampleFile} (${e.message}); showing no events.`);
        return none;
      }
    }

    warn("no calendar configured; showing no events.");
    return none;
  } catch (e) {
    warn(`unexpected calendar error (${e.message}); showing no events.`);
    return none;
  }
}
