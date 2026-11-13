// Homepage composition (DESIGN.md 10.3, 10.5-10.9, 11, 12).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, page } from "../helpers/build.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const site = JSON.parse(readFileSync(path.join(root, "src/_data/site.json"), "utf8"));
const text = (el) => el.text.replace(/\s+/g, " ").trim();
const PREFIX = "/school-poc";

await build();
await build({ name: "no-news", env: { NEWS_EMPTY: "1" } });

const home = () => page("index.html");
const main = () => home().querySelector("main");
const section = (name, variant) =>
  page("index.html", variant).querySelector(`main [data-home-section="${name}"]`);

test("homepage sections come in the blueprint order", () => {
  const order = main().querySelectorAll("[data-home-section]").map((el) => el.getAttribute("data-home-section"));
  assert.deepEqual(order, ["hero", "actions", "tasks", "pride", "news", "events", "welcome"]);
  assert.equal(text(section("news").querySelector("h2")), "Tiger news");
  assert.equal(text(section("events").querySelector("h2")), "Upcoming events");
});

test("one h1 with the display headline; the highlight is gold on dark", () => {
  const h1s = home().querySelectorAll("h1");
  assert.equal(h1s.length, 1);
  assert.ok(section("hero").querySelector("h1"), "the h1 is in the hero");
  const h1 = text(h1s[0]);
  assert.match(h1, /Curious minds\./);
  assert.match(h1, /Kind hearts\./);
  const highlight = h1s[0].querySelector(".text-accent-on-dark");
  assert.ok(highlight, "highlight wrapped in .text-accent-on-dark");
  assert.equal(text(highlight), "Kind hearts.");
  assert.match(text(section("hero")), /A neighborhood public school in Uptown/);
});

test("hero without a photo shows the labeled placeholder under the navy-deep overlay", () => {
  const hero = section("hero");
  const ph = hero.querySelector(".hero__media .ph");
  assert.ok(ph, "placeholder inside the hero media");
  assert.equal(ph.getAttribute("aria-label"), "Photo placeholder: Kids at recess");
  assert.ok(hero.querySelector(".hero__overlay"), "gradient overlay present");
});

test("button pair: Enroll now then Book a tour", () => {
  const links = section("actions").querySelectorAll("a");
  assert.equal(links.length, 2);
  assert.equal(text(links[0]), "Enroll now");
  assert.equal(links[0].getAttribute("href"), `${PREFIX}/enroll/`);
  assert.ok(links[0].classList.contains("btn--primary"));
  assert.equal(text(links[1]), "Book a tour");
  assert.equal(links[1].getAttribute("href"), `${PREFIX}/about/tours/`);
  assert.ok(links[1].classList.contains("btn--secondary"));
});

test("quick tasks: six links in order with the right destinations", () => {
  const links = section("tasks").querySelectorAll("a");
  assert.deepEqual(links.map(text), ["Calendar", "Lunch menu", "Parent portal", "Enroll", "Before & after care", "Contact"]);
  assert.deepEqual(links.map((a) => a.getAttribute("href")), [
    `${PREFIX}/events/`,
    site.links.lunchMenu,
    site.links.parentPortal,
    `${PREFIX}/enroll/`,
    `${PREFIX}/families/before-after-care/`,
    `${PREFIX}/contact/`,
  ]);
  assert.ok(section("tasks").querySelector(".quick-tasks--tiles"));
});

test("quick-task and nav URLs are each defined once", () => {
  const partial = readFileSync(path.join(root, "src/_includes/partials/quick-tasks.njk"), "utf8");
  for (const url of ["/enroll/", "/contact/", "/events/", "/families/before-after-care/"]) {
    assert.ok(!partial.includes(`"${url}"`), `quick-tasks.njk must not hard-code ${url}`);
  }
});

test("pride band: three facts with the placeholder values", () => {
  const items = section("pride").querySelectorAll(".pride__item");
  assert.equal(items.length, 3);
  assert.deepEqual(items.map((li) => text(li.querySelector(".pride__value"))), ["000", "PRE-K–8", "00:1"]);
  assert.deepEqual(items.map((li) => text(li.querySelector(".pride__label"))), ["Students", "Grades", "Student–teacher ratio"]);
});

test("news: the three newest posts as cards and See all news", () => {
  const cards = section("news").querySelectorAll(".news-card");
  assert.equal(cards.length, 3);
  const newest = page("news/index.html").querySelectorAll("main .news-card").slice(0, 3);
  const href = (c) => c.querySelector(".news-card__link").getAttribute("href");
  assert.deepEqual(cards.map(href), newest.map(href));
  for (const c of cards) assert.ok(c.querySelector("h3.news-card__title"), "card titles are h3 under the h2");
  const more = section("news").querySelectorAll("a").find((a) => text(a) === "See all news");
  assert.ok(more, "See all news link");
  assert.equal(more.getAttribute("href"), `${PREFIX}/news/`);
});

test("events: at most four upcoming items and See full calendar", () => {
  const items = section("events").querySelectorAll(".event");
  assert.ok(items.length >= 1 && items.length <= 4, `found ${items.length}`);
  const allUpcoming = page("events/index.html").querySelectorAll("main .event");
  assert.equal(items.length, Math.min(4, allUpcoming.length));
  const more = section("events").querySelectorAll("a").find((a) => text(a) === "See full calendar");
  assert.ok(more, "See full calendar link");
  assert.equal(more.getAttribute("href"), `${PREFIX}/events/`);
});

test("welcome: photo placeholder, title, message and link to the full message", () => {
  const w = section("welcome");
  assert.equal(text(w.querySelector("h2")), "A message from the principal");
  assert.equal(w.querySelector(".ph").getAttribute("aria-label"), "Photo placeholder: Principal Mendez");
  assert.match(text(w), /Mrs\. Keri Mendez, Principal/);
  const link = w.querySelectorAll("a").find((a) => text(a) === "Read the full message");
  assert.ok(link);
  assert.equal(link.getAttribute("href"), `${PREFIX}/about/principal/`);
});

test("with no posts the news section and its heading are absent", () => {
  assert.equal(section("news", "no-news"), null);
  const h2s = page("index.html", "no-news").querySelectorAll("main h2").map(text);
  assert.ok(!h2s.includes("Tiger news"));
  assert.ok(section("events", "no-news"), "the rest of the page still renders");
});

test("headings go down one level at a time", () => {
  const levels = main().querySelectorAll("h1, h2, h3, h4, h5, h6").map((h) => Number(h.tagName[1]));
  let prev = 0;
  for (const l of levels) {
    assert.ok(l <= prev + 1, `heading level jumps from h${prev} to h${l}`);
    prev = l;
  }
});

test("nothing animates or rotates except the hero entrance", () => {
  const doc = home();
  assert.equal(doc.querySelectorAll("marquee, [data-carousel]").length, 0);
  for (const el of doc.querySelectorAll("[style]")) {
    assert.doesNotMatch(el.getAttribute("style"), /animation/i, "no inline animation");
  }
  const entering = doc.querySelectorAll(".hero-enter");
  assert.ok(entering.length >= 1, "the hero has its entrance class");
  for (const el of entering) {
    assert.ok(el.closest('[data-home-section="hero"]') || el.closest('[data-home-section="actions"]'),
      "entrance only on the hero headline and buttons");
  }
  // Every CSS rule that declares an animation belongs to the hero entrance class (or the search spinner).
  for (const file of ["base.css", "components.css", "pages.css"]) {
    const css = readFileSync(path.join(root, "src/css", file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const [selector, body] = [m[1].trim(), m[2]];
      if (!/(^|[;\s])animation(-name)?\s*:/.test(body)) continue;
      if (/animation(-name)?\s*:\s*none/.test(body)) continue;
      // The search button's loading spinner (DESIGN.md 10.0) is the one other animation; it stops under reduced motion.
      if (/\.search-form__spinner/.test(selector)) continue;
      assert.match(selector, /\.hero-enter/, `${file}: "${selector}" declares an animation`);
    }
  }
});
