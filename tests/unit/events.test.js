import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { formatDate, formatTime } from "../../lib/dates.js";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { upcomingEvents, eventWhen, groupByMonth, chicagoDay, loadCalendar, feedFetcher, eventsWithin } from "../../lib/events.js";

const ics = readFileSync(new URL("../fixtures/calendar.ics", import.meta.url), "utf8");
const now = new Date("2026-11-13T18:00:00Z");
const events = upcomingEvents(ics, now);
const titles = events.map((e) => e.title);
const ALL = 8; // upcoming fixture events within the default 365 days
const day = (e) => chicagoDay(e.start);

test("past and cancelled events are absent", () => {
  assert.ok(!titles.includes("Past assembly"));
  assert.ok(!titles.includes("Cancelled science night"));
});

test("the in-progress multi-day event comes first; the list is sorted ascending", () => {
  assert.equal(events[0].title, "Fall book fair");
  assert.equal(events[0].allDay, true);
  for (let i = 1; i < events.length; i++) {
    assert.ok(events[i - 1].start <= events[i].start, `${titles[i - 1]} before ${titles[i]}`);
  }
});

test("exactly the upcoming fixture events, in order", () => {
  assert.deepEqual(
    events.map((e) => `${day(e)} ${e.title}`),
    [
      "2026-11-12 Fall book fair",
      "2026-11-16 Coffee with the principal",
      "2026-11-26 Thanksgiving: no school",
      "2026-11-26 PAC meeting",
      "2026-12-03 PAC meeting",
      "2026-12-10 PAC meeting",
      "2026-12-17 PAC meeting",
      "2027-03-04 Spring concert",
    ]
  );
});

test("EXDATE drops the 2026-11-19 PAC instance; 2026-11-26 stays at 6:00 pm across DST", () => {
  const pac = events.filter((e) => e.title === "PAC meeting");
  assert.ok(!pac.some((e) => day(e) === "2026-11-19"));
  const nov26 = pac.find((e) => day(e) === "2026-11-26");
  assert.ok(nov26);
  assert.equal(formatTime(nov26.start), "6:00 pm");
  assert.equal(formatTime(nov26.end), "7:00 pm");
  assert.equal(nov26.location, "Library");
});

test("instances have unique ids", () => {
  assert.equal(new Set(events.map((e) => e.id)).size, events.length);
});

test("the single event keeps its time and place", () => {
  const coffee = events.find((e) => e.title === "Coffee with the principal");
  assert.equal(coffee.allDay, false);
  assert.equal(coffee.location, "Room 108");
  assert.equal(formatTime(coffee.start), "8:30 am");
  assert.equal(formatTime(coffee.end), "9:30 am");
  assert.equal(coffee.description, "Drop in for coffee and questions. All families welcome.");
});

test("an all-day event keeps its Chicago calendar date", () => {
  const t = events.find((e) => e.title === "Thanksgiving: no school");
  assert.equal(t.allDay, true);
  assert.equal(formatDate(t.start, "list"), "Thursday, Nov 26");
  assert.equal(t.location, "");
});

test("all-day dates do not shift with the build machine's time zone", () => {
  for (const tz of ["UTC", "Asia/Tokyo", "Pacific/Honolulu", "America/Chicago"]) {
    const out = execFileSync(
      process.execPath,
      ["--input-type=module", "-e",
        `import { readFileSync } from "node:fs";
         import { upcomingEvents, chicagoDay } from ${JSON.stringify(new URL("../../lib/events.js", import.meta.url).href)};
         const ics = readFileSync(${JSON.stringify(new URL("../fixtures/calendar.ics", import.meta.url).pathname)}, "utf8");
         const list = upcomingEvents(ics, new Date("2026-11-13T18:00:00Z"));
         process.stdout.write(list.map((e) => chicagoDay(e.start) + " " + e.title).join("|"));`],
      { env: { ...process.env, TZ: tz }, encoding: "utf8" }
    );
    assert.equal(
      out,
      events.map((e) => `${day(e)} ${e.title}`).join("|"),
      tz
    );
  }
});

test("an all-day event that ended yesterday in Chicago is gone", () => {
  // The book fair's last day is Saturday Nov 14; on Sunday morning it is over.
  const sunday = upcomingEvents(ics, new Date("2026-11-15T07:00:00Z"));
  assert.ok(!sunday.some((e) => e.title === "Fall book fair"));
  const saturdayNight = upcomingEvents(ics, new Date("2026-11-15T05:30:00Z"));
  assert.equal(saturdayNight[0].title, "Fall book fair");
});

test("limit and days options", () => {
  assert.equal(upcomingEvents(ics, now, { limit: 4 }).length, 4);
  const week = upcomingEvents(ics, now, { days: 7 }).map((e) => e.title);
  assert.deepEqual(week, ["Fall book fair", "Coffee with the principal"]);
  assert.ok(!upcomingEvents(ics, now, { days: 90 }).some((e) => e.title === "Spring concert"));
});

test("malformed or empty ICS returns [] without throwing", () => {
  for (const bad of ["garbage", "BEGIN:VEVENT\nnope", "", null, undefined, "BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:No start\nEND:VEVENT\nEND:VCALENDAR"]) {
    assert.deepEqual(upcomingEvents(bad, now), [], String(bad));
  }
});

test("eventWhen: timed, all-day, multi-day all-day", () => {
  const byTitle = (t) => events.find((e) => e.title === t);
  assert.equal(eventWhen(byTitle("Coffee with the principal"), "All day"), "8:30 am – 9:30 am");
  assert.equal(eventWhen(byTitle("Thanksgiving: no school"), "All day"), "All day");
  assert.equal(eventWhen(byTitle("Fall book fair"), "All day"), "Thursday, Nov 12 – Saturday, Nov 14");
});

test("eventWhen: a timed event without an end shows its start time only", () => {
  const start = new Date("2026-11-16T14:30:00Z");
  assert.equal(eventWhen({ start, end: start, allDay: false }, "All day"), "8:30 am");
});

test("groupByMonth keeps order and labels months", () => {
  const groups = groupByMonth(events);
  assert.deepEqual(groups.map((g) => g.key), ["2026-11", "2026-12", "2027-03"]);
  assert.deepEqual(groups.map((g) => g.label), ["November 2026", "December 2026", "March 2027"]);
  assert.deepEqual(groups.map((g) => g.items.length), [4, 3, 1]);
  assert.deepEqual(groupByMonth([]), []);
});

// ---- Source order: env file -> live URL -> cached copy -> sample file -> none ----

const quiet = { warn: () => {} };

test("loadCalendar: the env file wins and is read from disk", async () => {
  const r = await loadCalendar({ file: "tests/fixtures/calendar.ics", url: "https://x.test/a.ics", fetchText: () => { throw new Error("must not fetch"); }, sampleFile: "nope.ics", now, logger: quiet });
  assert.equal(r.source, "file");
  assert.equal(r.items.length, ALL);
});

test("loadCalendar: a URL is fetched fresh (1h) and marked live", async () => {
  const calls = [];
  const r = await loadCalendar({
    url: "https://x.test/a.ics",
    fetchText: async (url, duration) => { calls.push(duration); return ics; },
    now, logger: quiet,
  });
  assert.equal(r.source, "live");
  assert.deepEqual(calls, ["1h"]);
  assert.equal(r.items.length, ALL);
});

test("loadCalendar: on fetch error the cached copy is used", async () => {
  const calls = [];
  const warnings = [];
  const r = await loadCalendar({
    url: "https://x.test/a.ics",
    fetchText: async (url, duration) => {
      calls.push(duration);
      if (duration === "1h") throw new Error("offline");
      return ics;
    },
    now, logger: { warn: (m) => warnings.push(m) },
  });
  assert.equal(r.source, "cache");
  assert.deepEqual(calls, ["1h", "*"]);
  assert.equal(r.items.length, ALL);
  assert.equal(warnings.length, 1);
});

test("loadCalendar: no feed, no cache -> empty list with a warning, never throws", async () => {
  const warnings = [];
  const r = await loadCalendar({
    url: "https://x.test/a.ics",
    fetchText: async () => { throw new Error("offline"); },
    now, logger: { warn: (m) => warnings.push(m) },
  });
  assert.deepEqual(r, { items: [], source: "none" });
  assert.ok(warnings.length >= 1);
});

test("loadCalendar: an empty URL uses the sample calendar", async () => {
  const r = await loadCalendar({ url: "", sampleFile: "tests/fixtures/calendar.ics", fetchText: () => { throw new Error("must not fetch"); }, now, logger: quiet });
  assert.equal(r.source, "file");
  assert.equal(r.items.length, ALL);
});

test("loadCalendar: a missing env file or sample gives none, not a crash", async () => {
  const warnings = [];
  const r = await loadCalendar({ file: "tests/fixtures/missing.ics", now, logger: { warn: (m) => warnings.push(m) } });
  assert.deepEqual(r, { items: [], source: "none" });
  assert.equal(warnings.length, 1);
  const r2 = await loadCalendar({ url: "", sampleFile: "nope.ics", now, logger: quiet });
  assert.deepEqual(r2, { items: [], source: "none" });
});

test("feedFetcher: live copy, then the cached copy once the feed is down, then nothing", async (t) => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "events-cache-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const server = http.createServer((req, res) => { res.writeHead(200); res.end(ics); });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  const url = `http://127.0.0.1:${server.address().port}/feed.ics`;
  const fetchText = feedFetcher(dir);
  // A 1s freshness window stands in for the real 1h one.
  const short = (u, d) => fetchText(u, d === "1h" ? "1s" : d);

  const live = await loadCalendar({ url, fetchText: short, now, logger: quiet });
  assert.equal(live.source, "live");
  assert.equal(live.items.length, ALL);

  await new Promise((ok) => server.close(ok));
  await new Promise((ok) => setTimeout(ok, 1100));
  const cached = await loadCalendar({ url, fetchText: short, now, logger: quiet });
  assert.equal(cached.source, "cache");
  assert.equal(cached.items.length, ALL);

  await assert.rejects(fetchText(url.replace("feed", "never"), "*"), /nothing cached/);
});

test("eventsWithin keeps events starting within the window, in-progress ones included", () => {
  const within = eventsWithin(events, now, 90).map((e) => e.title);
  assert.equal(within.length, 7);
  assert.equal(within[0], "Fall book fair");
  assert.ok(!within.includes("Spring concert"));
  assert.deepEqual(eventsWithin(events, now, 7).map((e) => e.title), ["Fall book fair", "Coffee with the principal"]);
  assert.deepEqual(eventsWithin(undefined, now, 90), []);
});

test("feedFetcher: a 200 HTML page (private calendar) is a failure and never replaces the good copy", async (t) => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "events-cache-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  let mode = "ics";
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "content-type": mode === "ics" ? "text/calendar" : "text/html" });
    res.end(mode === "ics" ? ics : "<!doctype html><title>Sign in - Google Calendar</title>");
  });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const fetchText = feedFetcher(dir);
  const short = (u, d) => fetchText(u, d === "1h" ? "1s" : d);

  // Never cached + HTML: nothing to show, with a warning that names the problem.
  mode = "html";
  const warnings = [];
  const none = await loadCalendar({ url: `${base}/private.ics`, fetchText: short, now, logger: { warn: (m) => warnings.push(m) } });
  assert.deepEqual(none, { items: [], source: "none" });
  assert.match(warnings.join("\n"), /not an iCalendar file/);
  await assert.rejects(fetchText(`${base}/private.ics`, "*"), /nothing cached/);

  // A good copy first, then the feed turns private.
  mode = "ics";
  const url = `${base}/feed.ics`;
  assert.equal((await loadCalendar({ url, fetchText: short, now, logger: quiet })).source, "live");
  mode = "html";
  await new Promise((ok) => setTimeout(ok, 1100));
  const warned = [];
  const cached = await loadCalendar({ url, fetchText: short, now, logger: { warn: (m) => warned.push(m) } });
  assert.equal(cached.source, "cache");
  assert.equal(cached.items.length, ALL);
  assert.match(warned.join("\n"), /not an iCalendar file/);
  // The good copy is still the one on disk (what a fresh build process would read).
  const bodies = readdirSync(dir).filter((f) => f.endsWith(".text")).map((f) => readFileSync(path.join(dir, f), "utf8"));
  assert.equal(bodies.length, 1);
  assert.match(bodies[0], /BEGIN:VCALENDAR/);
});

test("the shipped sample calendar always has upcoming events, invented names only", () => {
  const sample = readFileSync(new URL("../../src/_data/sample-calendar.ics", import.meta.url), "utf8");
  assert.match(sample, /RRULE:FREQ=WEEKLY/);
  assert.match(sample, /RRULE:FREQ=MONTHLY/);
  for (const when of [now, new Date("2027-08-01T12:00:00Z"), new Date("2029-03-10T12:00:00Z")]) {
    assert.ok(upcomingEvents(sample, when, { limit: 4 }).length === 4, `4 upcoming at ${when.toISOString()}`);
  }
});
