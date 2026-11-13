import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, page } from "../helpers/build.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const strings = JSON.parse(readFileSync(path.join(root, "src/_settings/strings.en.json"), "utf8"));
const site = JSON.parse(readFileSync(path.join(root, "src/_data/site.json"), "utf8"));
const text = (el) => el.text.replace(/\s+/g, " ").trim();
const PREFIX = "/school-poc";

await build();
await build({ name: "no-events", env: { CALENDAR_ICS_FILE: "tests/fixtures/empty.ics" } });
// The shipped sample calendar (what shows until an admin pastes the feed address). Read from the
// file so a feed address in site.json is never fetched by tests; the fallback order itself
// (env file -> feed -> cache -> sample) is unit-tested in tests/unit/events.test.js.
await build({ name: "sample-events", env: { CALENDAR_ICS_FILE: "src/_data/sample-calendar.ics" } });

const eventsOn = (p, variant) => page(p, variant).querySelectorAll("main .event");
const summary = (el) => ({
  month: text(el.querySelector(".event__month")),
  day: text(el.querySelector(".event__day")),
  datetime: el.querySelector(".event__date time").getAttribute("datetime"),
  title: text(el.querySelector(".event__title")),
  when: text(el.querySelector(".event__time")),
  where: el.querySelector(".event__place") ? text(el.querySelector(".event__place")) : "",
});

test("the CMS calendar.json list is retired", () => {
  assert.ok(!existsSync(path.join(root, "src/_data/calendar.json")));
});

test("/events/ has one h1 from strings and the events data source", () => {
  const doc = page("events/index.html");
  const h1s = doc.querySelectorAll("h1");
  assert.equal(h1s.length, 1);
  assert.equal(text(h1s[0]), strings.events.heading);
  assert.match(doc.querySelector("title").text, new RegExp(`^${strings.events.heading} ·`));
  assert.equal(doc.querySelector("main [data-events-source]").getAttribute("data-events-source"), "file");
});

test("/events/ lists every upcoming fixture event with date block, title, time and place", () => {
  assert.deepEqual(eventsOn("events/index.html").map(summary), [
    { month: "Nov", day: "12", datetime: "2026-11-12", title: "Fall book fair", when: "Thursday, Nov 12 – Saturday, Nov 14", where: "Library" },
    { month: "Nov", day: "16", datetime: "2026-11-16", title: "Coffee with the principal", when: "8:30 am – 9:30 am", where: "Room 108" },
    { month: "Nov", day: "26", datetime: "2026-11-26", title: "Thanksgiving: no school", when: strings.events.allDay, where: "" },
    { month: "Nov", day: "26", datetime: "2026-11-26", title: "PAC meeting", when: "6:00 pm – 7:00 pm", where: "Library" },
    { month: "Dec", day: "3", datetime: "2026-12-03", title: "PAC meeting", when: "6:00 pm – 7:00 pm", where: "Library" },
    { month: "Dec", day: "10", datetime: "2026-12-10", title: "PAC meeting", when: "6:00 pm – 7:00 pm", where: "Library" },
    { month: "Dec", day: "17", datetime: "2026-12-17", title: "PAC meeting", when: "6:00 pm – 7:00 pm", where: "Library" },
  ]);
});

test("/events/ groups events by month under h2 headings, event titles are h3", () => {
  const doc = page("events/index.html");
  const groups = doc.querySelectorAll("main .events-month");
  assert.deepEqual(groups.map((g) => text(g.querySelector("h2"))), ["November 2026", "December 2026"]);
  assert.deepEqual(groups.map((g) => g.querySelectorAll(".event").length), [4, 3]);
  assert.equal(doc.querySelectorAll("main h3.event__title").length, 7);
});

test("past, cancelled and EXDATE-removed events never show", () => {
  const html = page("events/index.html").querySelector("main").toString();
  assert.doesNotMatch(html, /Past assembly/);
  assert.doesNotMatch(html, /Cancelled science night/);
  assert.ok(!eventsOn("events/index.html").map(summary).some((e) => e.datetime === "2026-11-19"));
});

test("the date block is decorative; a full date is there for screen readers", () => {
  const first = eventsOn("events/index.html")[1];
  assert.equal(first.querySelector(".event__month").getAttribute("aria-hidden"), "true");
  assert.equal(first.querySelector(".event__day").getAttribute("aria-hidden"), "true");
  assert.equal(text(first.querySelector(".event__date .visually-hidden")), "Monday, Nov 16");
});

test("event descriptions show as plain text", () => {
  const coffee = eventsOn("events/index.html")[1];
  assert.equal(text(coffee.querySelector(".event__desc")), "Drop in for coffee and questions. All families welcome.");
  assert.equal(coffee.querySelector(".event__desc b"), null);
});

test("the date block is navy with a gold month and a white day (semantic tokens)", () => {
  const css = readFileSync(path.join(root, "src/css/components.css"), "utf8");
  const rule = (sel) => {
    const m = new RegExp(`(^|\\n)${sel.replace(/[.]/g, "\\.")}\\s*\\{([^}]*)\\}`).exec(css);
    assert.ok(m, `${sel} rule exists`);
    return m[2];
  };
  assert.match(rule(".event__date"), /background:\s*var\(--color-surface-brand\)/);
  assert.match(rule(".event__month"), /color:\s*var\(--color-text-accent-on-dark\)/);
  assert.match(rule(".event__day"), /color:\s*var\(--color-text-on-dark\)/);
});

test("/events/ shows the next 90 days only", () => {
  const doc = page("events/index.html");
  assert.doesNotMatch(doc.querySelector("main").toString(), /Spring concert/);
  assert.deepEqual(doc.querySelectorAll("main .events-month h2").map(text), ["November 2026", "December 2026"]);
  const front = readFileSync(path.join(root, "src/events/index.njk"), "utf8");
  assert.match(front, /^eventsDays: 90$/m, "the window is a named option on the page");
});

test("/events/ ends with a See the CPS district calendar link after the months", () => {
  const container = page("events/index.html").querySelector("main .events");
  const kids = container.childNodes.filter((n) => n.nodeType === 1 && !n.hasAttribute("hidden"));
  const last = kids[kids.length - 1];
  assert.ok(kids[kids.length - 2].classList.contains("events-month"), "link follows the month groups");
  const link = last.querySelector("a");
  assert.equal(text(link), strings.events.cpsCalendar);
  assert.equal(strings.events.cpsCalendar, "See the CPS district calendar");
  assert.equal(link.getAttribute("href"), site.links.cpsCalendar);
});

test("with no upcoming events the page shows the one-line empty state linking to the CPS calendar", () => {
  const doc = page("events/index.html", "no-events");
  assert.equal(doc.querySelectorAll("main .event").length, 0);
  assert.equal(doc.querySelectorAll("main .events-month").length, 0);
  assert.equal(doc.querySelectorAll("main h2").length, 0, "no empty month headings");
  const empty = doc.querySelector("main .events-empty");
  assert.equal(text(empty), "No events scheduled — see the CPS calendar for district dates.");
  assert.equal(text(empty), strings.empty.events);
  const link = empty.querySelector("a");
  assert.equal(link.getAttribute("href"), site.links.cpsCalendar);
  assert.equal(text(link), strings.events.cpsCalendarLink);
});

test("the homepage shows the next 4 events and links to the full calendar under the prefix", () => {
  const home = eventsOn("index.html");
  assert.deepEqual(home.map((e) => text(e.querySelector(".event__title"))), [
    "Fall book fair", "Coffee with the principal", "Thanksgiving: no school", "PAC meeting",
  ]);
  const doc = page("index.html");
  assert.doesNotMatch(doc.querySelector("main").toString(), /Picture day|Upcoming dates/);
  const more = doc.querySelectorAll("main a").filter((a) => text(a) === strings.events.seeFullCalendar);
  assert.equal(more.length, 1);
  assert.equal(more[0].getAttribute("href"), `${PREFIX}/events/`);
});

test("the homepage shows the empty line when nothing is scheduled", () => {
  const doc = page("index.html", "no-events");
  assert.equal(doc.querySelectorAll("main .event").length, 0);
  assert.equal(text(doc.querySelector("main .events-empty")), strings.empty.events);
});

test("the shipped sample calendar fills the page", () => {
  const doc = page("events/index.html", "sample-events");
  assert.equal(doc.querySelector("main [data-events-source]").getAttribute("data-events-source"), "file");
  const titles = eventsOn("events/index.html", "sample-events").map((e) => text(e.querySelector(".event__title")));
  assert.ok(titles.length >= 4);
  assert.ok(titles.includes("Library open early"));
});

test("every test build reads its calendar from a file (the live feed is never fetched)", () => {
  assert.throws(() => build({ name: "no-calendar-file", env: { CALENDAR_ICS_FILE: "" } }), /CALENDAR_ICS_FILE/);
});

test("each event carries its end time for the browser to drop it once it has ended", () => {
  const items = eventsOn("events/index.html");
  assert.equal(items[1].getAttribute("data-event-end"), "2026-11-16T15:30:00.000Z", "Coffee with the principal ends 9:30 am Chicago");
  for (const el of [...items, ...eventsOn("index.html")]) {
    assert.match(el.getAttribute("data-event-end"), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  }
});

test("with events listed, a hidden empty-state line waits for the browser to show it", () => {
  for (const p of ["events/index.html", "index.html"]) {
    const box = page(p).querySelector("main [data-events]");
    assert.ok(box, `${p}: events container`);
    const empty = box.querySelectorAll("[data-events-empty]");
    assert.equal(empty.length, 1, p);
    assert.ok(empty[0].hasAttribute("hidden"), `${p}: hidden while events are listed`);
    assert.ok(empty[0].classList.contains("events-empty"));
    assert.equal(text(empty[0]), strings.empty.events);
  }
  assert.ok(page("events/index.html").querySelector("main [data-events-more]"), "the CPS link goes when the list empties");
  // With nothing scheduled, the visible empty state is the only one.
  for (const p of ["events/index.html", "index.html"]) {
    const empty = page(p, "no-events").querySelectorAll("main .events-empty");
    assert.equal(empty.length, 1, p);
    assert.ok(!empty[0].hasAttribute("hidden"), p);
  }
});
