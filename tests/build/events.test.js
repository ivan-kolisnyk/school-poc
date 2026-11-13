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
// No env file and no feed URL: the shipped sample calendar is used.
await build({ name: "sample-events", env: { CALENDAR_ICS_FILE: "" } });

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

test("/events/ links to the CPS district calendar", () => {
  const links = page("events/index.html").querySelectorAll("main a").filter((a) => a.getAttribute("href") === site.links.cpsCalendar);
  assert.ok(links.length >= 1);
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

test("without a feed or env file the sample calendar fills the page", () => {
  const doc = page("events/index.html", "sample-events");
  assert.equal(doc.querySelector("main [data-events-source]").getAttribute("data-events-source"), "file");
  const titles = eventsOn("events/index.html", "sample-events").map((e) => text(e.querySelector(".event__title")));
  assert.ok(titles.length >= 4);
  assert.ok(titles.includes("Library open early"));
});
