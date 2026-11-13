// Homepage composition (DESIGN.md 10.3, 10.5-10.9, 11, 12).
// The real homepage (src/index.md) is checked against its own front matter, so any CMS edit
// passes; exact copy is checked on the fixture homepage (tests/fixtures/home/home.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { build, page, buildLog } from "../helpers/build.js";
import { root, home, siteData, newsPosts, showsPhoto } from "../helpers/content.js";
import { safeHref } from "../../lib/content.js"; // unit-tested in tests/unit/content.test.js

const site = siteData();
const fm = home().data;
const text = (el) => el.text.replace(/\s+/g, " ").trim();
const PREFIX = "/school-poc";
const prefixed = (href) => (href.startsWith("/") ? `${PREFIX}${href}` : href);

await build();
await build({ name: "home-fixture", env: { HOME_FIXTURE: "tests/fixtures/home/home.md" } });
await build({ name: "no-news", env: { NEWS_EMPTY: "1" } });
await build({ name: "hero-no-alt", env: { HOME_FIXTURE: "tests/fixtures/home/hero-without-alt.md" } });
await build({ name: "unsafe-link", env: { HOME_FIXTURE: "tests/fixtures/home/unsafe-link.md" } });

const home$ = (variant) => page("index.html", variant);
const main = (variant) => home$(variant).querySelector("main");
const section = (name, variant) => home$(variant).querySelector(`main [data-home-section="${name}"]`);

// ---------- The real homepage renders whatever the principal saved ----------

test("homepage sections come in the blueprint order", () => {
  const order = main().querySelectorAll("[data-home-section]").map((el) => el.getAttribute("data-home-section"));
  const expected = ["hero", "actions", "tasks", "menu", "news", "events", "welcome"]
    .filter((s) => s !== "news" || newsPosts().length > 0);
  assert.deepEqual(order, expected);
  assert.deepEqual(main("home-fixture").querySelectorAll("[data-home-section]").map((el) => el.getAttribute("data-home-section")),
    ["hero", "actions", "tasks", "menu", "news", "events", "welcome"]);
});

test("one h1, in the hero, with the headline and the highlight in gold", () => {
  const h1s = home$().querySelectorAll("h1");
  assert.equal(h1s.length, 1);
  assert.ok(section("hero").querySelector("h1"), "the h1 is in the hero");
  const words = [fm.hero_heading, fm.hero_highlight].filter(Boolean).join(" ");
  assert.equal(text(h1s[0]), words.replace(/\s+/g, " ").trim());
  const highlight = h1s[0].querySelector(".text-accent-on-dark");
  if (fm.hero_highlight) assert.equal(text(highlight), String(fm.hero_highlight).trim());
  else assert.equal(highlight, null);
  if (fm.hero_sub) assert.equal(text(section("hero").querySelector(".hero__sub")), String(fm.hero_sub).trim());
});

test("hero shows the photo only with alt text and an existing file, else the labeled placeholder", () => {
  const hero = section("hero");
  const img = hero.querySelector(".hero__media img");
  if (showsPhoto(fm.hero_image, fm.hero_alt)) {
    assert.equal(img.getAttribute("alt"), String(fm.hero_alt).trim());
    assert.equal(hero.querySelector(".hero__media .ph"), null);
  } else {
    assert.equal(img, null);
    assert.equal(hero.querySelector(".hero__media .ph").getAttribute("aria-label"), `Photo placeholder: ${fm.hero_placeholder ?? ""}`.trim());
  }
  assert.ok(hero.querySelector(".hero__overlay"), "gradient overlay present");
  // The build warns about the hero exactly when a photo is set but cannot show.
  const warned = /\[home\]/.test(buildLog());
  assert.equal(warned, Boolean(String(fm.hero_image ?? "").trim()) && !showsPhoto(fm.hero_image, fm.hero_alt));
});

test("pride band is hidden for now: no section and no placeholder numbers on the homepage", () => {
  for (const variant of [undefined, "home-fixture"]) {
    assert.equal(section("pride", variant), null);
    assert.equal(home$(variant).querySelector(".pride"), null);
  }
});

test("welcome: title, photo placeholder and the read-more link from the front matter", () => {
  const w = section("welcome");
  assert.equal(text(w.querySelector("h2")), String(fm.welcome_title ?? "").trim());
  assert.equal(w.querySelector(".ph").getAttribute("aria-label"), `Photo placeholder: ${fm.welcome_photo_placeholder ?? ""}`.trim());
  const link = w.querySelectorAll("a").find((a) => text(a) === "Read the full message");
  const href = safeHref(fm.welcome_link);
  if (href) assert.equal(link.getAttribute("href"), prefixed(href));
  else assert.equal(link, undefined);
});

// ---------- Template behaviour (fixed values from the fixture homepage) ----------

test("fixture: headline, gold highlight and supporting line", () => {
  const h1 = home$("home-fixture").querySelector("h1");
  assert.equal(text(h1), "Curious minds. Kind hearts.");
  assert.equal(text(h1.querySelector(".text-accent-on-dark")), "Kind hearts.");
  assert.match(text(section("hero", "home-fixture")), /A neighborhood public school in Uptown/);
  assert.equal(section("hero", "home-fixture").querySelector(".ph").getAttribute("aria-label"), "Photo placeholder: Kids at recess");
  assert.doesNotMatch(buildLog("home-fixture"), /\[home\]/, "a hero without a photo raises no warning");
});

test("fixture: welcome message, its pasted headings re-levelled under the section h2", () => {
  const w = section("welcome", "home-fixture");
  assert.equal(text(w.querySelector("h2")), "A message from the principal");
  assert.equal(w.querySelector(".ph").getAttribute("aria-label"), "Photo placeholder: Principal Mendez");
  assert.match(text(w), /Mrs\. Keri Mendez, Principal/);
  assert.deepEqual(w.querySelectorAll(".prose h1, .prose h2, .prose h3, .prose h4, .prose h5").map((h) => [h.tagName, text(h)]),
    [["H3", "Welcome back"], ["H4", "My door is open"]]);
  assert.equal(home$("home-fixture").querySelectorAll("h1").length, 1, "a pasted Heading 1 is not a second h1");
  const link = w.querySelectorAll("a").find((a) => text(a) === "Read the full message");
  assert.equal(link.getAttribute("href"), `${PREFIX}/about/principal/`);
});

test("an unsafe welcome link is left out, with a build warning", () => {
  const w = section("welcome", "unsafe-link");
  assert.equal(w.querySelectorAll("a").filter((a) => text(a) === "Read the full message").length, 0);
  assert.doesNotMatch(w.toString(), /javascript:/);
  assert.match(buildLog("unsafe-link"), /\[links\].*index\.md.*welcome_link "javascript:alert\(1\)"/);
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
    `${PREFIX}/families/lunch-menu/`,
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

test("news: the newest posts (up to three) as cards and See all news", (t) => {
  if (!newsPosts().length) return t.skip("no posts: the section is absent (tested with NEWS_EMPTY below)");
  const cards = section("news").querySelectorAll(".news-card");
  assert.equal(cards.length, Math.min(3, newsPosts().length));
  const newest = page("news/index.html").querySelectorAll("main .news-card").slice(0, 3);
  const href = (c) => c.querySelector(".news-card__link").getAttribute("href");
  assert.deepEqual(cards.map(href), newest.map(href));
  for (const c of cards) assert.ok(c.querySelector("h3.news-card__title"), "card titles are h3 under the h2");
  assert.equal(text(section("news").querySelector("h2")), "Tiger news");
  const more = section("news").querySelectorAll("a").find((a) => text(a) === "See all news");
  assert.ok(more, "See all news link");
  assert.equal(more.getAttribute("href"), `${PREFIX}/news/`);
});

test("events: at most four upcoming items and See full calendar", () => {
  const items = section("events").querySelectorAll(".event");
  assert.ok(items.length >= 1 && items.length <= 4, `found ${items.length}`);
  const allUpcoming = page("events/index.html").querySelectorAll("main .event");
  assert.equal(items.length, Math.min(4, allUpcoming.length));
  assert.equal(text(section("events").querySelector("h2")), "Upcoming events");
  const more = section("events").querySelectorAll("a").find((a) => text(a) === "See full calendar");
  assert.ok(more, "See full calendar link");
  assert.equal(more.getAttribute("href"), `${PREFIX}/events/`);
});

test("with no posts the news section and its heading are absent", () => {
  assert.equal(section("news", "no-news"), null);
  const h2s = page("index.html", "no-news").querySelectorAll("main h2").map(text);
  assert.ok(!h2s.includes("Tiger news"));
  assert.ok(section("events", "no-news"), "the rest of the page still renders");
});

test("headings go down one level at a time", () => {
  for (const variant of ["default", "home-fixture"]) {
    const levels = main(variant).querySelectorAll("h1, h2, h3, h4, h5, h6").map((h) => Number(h.tagName[1]));
    let prev = 0;
    for (const l of levels) {
      assert.ok(l <= prev + 1, `${variant}: heading level jumps from h${prev} to h${l}`);
      prev = l;
    }
  }
});

test("nothing animates or rotates except the hero entrance", () => {
  const doc = home$();
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

test("a hero photo without alt text shows the placeholder and warns at build time", () => {
  const hero = section("hero", "hero-no-alt");
  assert.equal(hero.querySelectorAll("img, picture").length, 0, "no photo without alt text");
  assert.ok(hero.querySelector(".ph"), "the labeled placeholder shows instead");
  assert.match(buildLog("hero-no-alt"), /\[home\].*index\.md.*no hero_alt/);
});
