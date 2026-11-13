// Inner pages, section navigation and migrated content (DESIGN.md 10.2, 10.4, 10.10, 13, 14, 16).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { build, page, buildLog } from "../helpers/build.js";
import { root, sectionEntries, contentPageFiles, navData, pageFile } from "../helpers/content.js";

// Pages are edited in Pages CMS: menus, titles and bodies change. Structure is checked against
// the source files; body rendering against the fixture page tests/fixtures/pages/rich-text.md.
const strings = JSON.parse(readFileSync(path.join(root, "src/_settings/strings.en.json"), "utf8"));
const site = JSON.parse(readFileSync(path.join(root, "src/_data/site.json"), "utf8"));
const text = (el) => el.text.replace(/\s+/g, " ").trim();
const PREFIX = "/school-poc";

const out = await build();
const fixtureOut = await build({ name: "pages-fixtures", env: { PAGES_FIXTURES_DIR: "tests/fixtures/pages" } });
const fixture = () => page("fixture-pages/rich-text/index.html", "pages-fixtures");

// Internal links that may not resolve yet (none: the staff directory is built).
const PENDING = new Set();

const EXTERNAL_LABELS = [strings.a11y.externalCps, strings.a11y.external];

/** Built file for an internal href, or null. */
function builtFile(href) {
  const clean = href.split(/[?#]/)[0];
  if (!clean.startsWith(`${PREFIX}/`)) return null;
  const rel = clean.slice(PREFIX.length + 1);
  return path.join(out, rel === "" || rel.endsWith("/") ? `${rel}index.html` : rel);
}

function allHtml(dir = out, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) allHtml(p, acc);
    else if (entry.name.endsWith(".html")) acc.push(path.relative(out, p));
  }
  return acc;
}

const CONTENT_PAGES = contentPageFiles();
/** A section's first child that is a real page (not a menu-only entry), or undefined. */
const firstChildPage = (key) => sectionEntries(key).find((e) => e.url);

// ---------- Navigation ----------

test("each dropdown lists the pages with that section, by menu order then title", () => {
  const nav = page("index.html").querySelector("header nav");
  for (const { key } of navData()) {
    const list = nav.querySelector(`#subnav-${key}`);
    const expected = sectionEntries(key).map((e) => String(e.data.title).trim());
    if (!expected.length) {
      assert.equal(list, null, `${key} has no dropdown`);
      continue;
    }
    assert.deepEqual(list.querySelectorAll("a").map(text), expected, key);
  }
  // News & Events is one page; its dropdown is never built.
  assert.equal(nav.querySelector("#subnav-news"), null);
});

test("every nav link and dropdown child resolves (internal file or marked external https)", () => {
  const links = page("index.html").querySelectorAll("header nav a[href]");
  assert.ok(links.length >= 5, `found ${links.length} nav links`);
  for (const a of links) {
    const href = a.getAttribute("href");
    if (/^https?:/.test(href)) {
      assert.match(href, /^https:\/\//, `${href} is https`);
      const marker = a.querySelector("svg.icon-external-link");
      assert.ok(marker, `${href} has the external icon`);
      assert.equal(marker.getAttribute("role"), "img");
      assert.ok(EXTERNAL_LABELS.includes(marker.getAttribute("aria-label")), `${href} external label`);
      if (/\/\/([a-z0-9-]+\.)*cps\.edu\//.test(href)) {
        assert.equal(marker.getAttribute("aria-label"), strings.a11y.externalCps, href);
      }
      continue;
    }
    assert.ok(href.startsWith(`${PREFIX}/`), `${href} carries the path prefix`);
    if (PENDING.has(href)) continue;
    assert.ok(existsSync(builtFile(href)), `${href} is built`);
    assert.equal(a.querySelector("svg.icon-external-link"), null, `${href} is internal: no external icon`);
  }
});

test("menu-only entries point at their destinations", () => {
  const nav = page("index.html").querySelector("header nav");
  const href = (label) => nav.querySelectorAll(".site-nav__sub a").find((a) => text(a) === label)?.getAttribute("href");
  assert.equal(href("Lunch menu"), `${PREFIX}/families/lunch-menu/`);
  assert.equal(href("Parent portal"), site.links.parentPortal);
  assert.equal(href("CPS calendar"), site.links.cpsCalendar);
  assert.equal(href("Events"), `${PREFIX}/events/`);
  assert.equal(href("Our staff"), `${PREFIX}/staff/`);
  assert.equal(href("Staff directory"), `${PREFIX}/staff/`);
});

test("dropdown marks the current page; the section link is current for its children", (t) => {
  const key = navData().map((n) => n.key).find((k) => firstChildPage(k));
  if (!key) return t.skip("no section has a child page");
  const child = firstChildPage(key);
  const nav = page(pageFile(child.url)).querySelector("header nav");
  const current = nav.querySelectorAll(".site-nav__sub a[aria-current]");
  assert.deepEqual(current.map(text), [String(child.data.title).trim()]);
  assert.equal(current[0].getAttribute("aria-current"), "page");
  const top = nav.querySelectorAll(".site-nav__list > li > a[aria-current]");
  assert.deepEqual(top.map(text), [strings.nav[key]]);
  assert.equal(top[0].getAttribute("aria-current"), "true");
});

test("menu-only entries build no page of their own", () => {
  for (const p of ["families/parent-portal", "families/cps-calendar", "families/events", "about/staff", "contact/staff-directory"]) {
    assert.equal(existsSync(path.join(out, p, "index.html")), false, p);
  }
});

// ---------- Every page ----------

// Holds for any body an editor writes: templates own the h1 and body headings are re-levelled.
test("every built page has exactly one h1 and no skipped heading levels", () => {
  const files = allHtml();
  assert.ok(files.length > 10);
  for (const file of [...files, "fixture-pages/rich-text/index.html"]) {
    const doc = file.startsWith("fixture-pages/") ? fixture() : page(file);
    assert.equal(doc.querySelectorAll("h1").length, 1, `${file}: one h1`);
    let prev = 0;
    for (const h of doc.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
      const level = Number(h.tagName[1]);
      assert.ok(level <= prev + 1, `${file}: <${h.tagName.toLowerCase()}> "${text(h)}" follows h${prev}`);
      prev = level;
    }
  }
});

test("content pages put their body in the reading column", () => {
  for (const file of CONTENT_PAGES) {
    const body = page(file).querySelector("main .page-body");
    assert.ok(body, `${file}: .page-body`);
    assert.ok(body.classList.contains("prose"), `${file}: reading column`);
  }
});

test("src/about.md is gone; About is the section hub", () => {
  assert.equal(existsSync(path.join(root, "src/about.md")), false);
  assert.ok(existsSync(path.join(root, "src/about/index.md")));
});

// ---------- Page header (10.4) ----------

test("child page header: breadcrumb Home / section, H1, intro", (t) => {
  const key = navData().map((n) => n.key).find((k) => firstChildPage(k));
  if (!key) return t.skip("no section has a child page");
  const child = firstChildPage(key);
  const header = page(pageFile(child.url)).querySelector("main .page-header");
  assert.ok(header.classList.contains("on-dark"));
  const crumbs = header.querySelectorAll(".breadcrumb a");
  const hub = navData().find((n) => n.key === key).url;
  assert.deepEqual(crumbs.map(text), ["Home", strings.nav[key]]);
  assert.deepEqual(crumbs.map((a) => a.getAttribute("href")), [`${PREFIX}/`, `${PREFIX}${hub}`]);
  assert.equal(text(header.querySelector("h1")), String(child.data.title).trim());
  const intro = header.querySelector(".page-header__intro");
  if (String(child.data.intro ?? "").trim()) assert.equal(text(intro), String(child.data.intro).trim());
  else assert.equal(intro, null);
});

test("hub page header: breadcrumb Home only", () => {
  const crumbs = page("about/index.html").querySelectorAll("main .breadcrumb a");
  assert.deepEqual(crumbs.map(text), ["Home"]);
});

test("hub pages list their section's pages as link rows, matching the dropdown", () => {
  for (const key of ["about", "families", "contact"]) {
    const hub = page(`${key}/index.html`).querySelector("main .link-rows");
    assert.ok(hub, `${key} hub has link rows`);
    const rows = hub.querySelectorAll("a").map((a) => a.getAttribute("href"));
    const menu = page("index.html").querySelectorAll(`#subnav-${key} a`).map((a) => a.getAttribute("href"));
    assert.deepEqual(rows, menu, key);
  }
  assert.equal(Boolean(page("enroll/index.html").querySelector("main .link-rows")), sectionEntries("enroll").length > 0, "Enroll lists children only if it has some");
});

// ---------- Content body (10.10) ----------

test("external links in page bodies carry the external icon with a label", () => {
  const body = fixture().querySelector("main .page-body");
  const gocps = body.querySelectorAll("a").find((a) => /go\.cps\.edu/.test(a.getAttribute("href")));
  assert.equal(gocps.querySelector("svg.icon-external-link").getAttribute("aria-label"), strings.a11y.externalCps);
  const cel = body.querySelectorAll("a").find((a) => /chicagoearlylearning\.org/.test(a.getAttribute("href")));
  assert.equal(cel.querySelector("svg.icon-external-link").getAttribute("aria-label"), strings.a11y.external);
  const mail = body.querySelectorAll("a").find((a) => a.getAttribute("href") === "mailto:Courtenay_Tigers@cps.edu");
  assert.ok(mail, "email link");
  assert.equal(mail.querySelector("svg"), null, "mailto is not external");
  const internal = body.querySelectorAll("a").find((a) => a.getAttribute("href") === `${PREFIX}/families/preschool/`);
  assert.ok(internal, "site paths in bodies carry the prefix");
  assert.equal(internal.querySelector("svg"), null);
});

test("callout shortcode renders a callout box with its markdown", () => {
  const callout = fixture().querySelector("main .page-body .callout");
  assert.ok(callout);
  assert.match(text(callout), /your child must be five years old by September 1/);
  assert.ok(callout.querySelector("p strong"), "inner markdown rendered");
});

test("document link states file type; an editor's HTML comment stays out of the page text", () => {
  const doc = fixture();
  const link = doc.querySelector("main .page-body a.doc-link");
  assert.ok(link);
  assert.match(text(link), /Getting ready for kindergarten \(PDF/);
  const html = readFileSync(path.join(fixtureOut, "fixture-pages/rich-text/index.html"), "utf8");
  assert.match(html, /<!--[^>]*An editor's note[^>]*-->/);
  assert.doesNotMatch(text(doc.querySelector("main")), /An editor's note/);
});

test("pasted headings are re-levelled under the page h1, never skipping a level", () => {
  const body = fixture().querySelector("main .page-body");
  assert.deepEqual(body.querySelectorAll("h1, h2, h3, h4, h5, h6").map((h) => [h.tagName, text(h)]), [
    ["H2", "A pasted Heading 1"],
    ["H3", "A Heading 4 straight after"],
    ["H2", "A Heading 2"],
    ["H3", "An HTML Heading 5"],
  ]);
});

test("a portrait placeholder comes from the front matter, above the body", () => {
  const body = fixture().querySelector("main .page-body");
  const first = body.childNodes.find((n) => n.nodeType === 1);
  assert.ok(first.classList.contains("page-portrait"));
  assert.equal(first.querySelector(".ph").getAttribute("aria-label"), "Photo placeholder: Fixture portrait");
  const principal = sectionEntries("about").find((e) => e.file === "src/about/principal.md");
  if (principal?.data.portrait_placeholder) {
    assert.ok(page("about/principal/index.html").querySelector("main .page-body > .page-portrait .ph"));
  }
  if (principal) assert.doesNotMatch(readFileSync(path.join(root, principal.file), "utf8"), /page-portrait/, "no layout markup in the rich-text body");
});

test("inline images: an existing one is a responsive picture; missing ones are left out with a warning", () => {
  const body = fixture().querySelector("main .page-body");
  const img = body.querySelector('picture img[alt="The Courtenay tiger shield"]');
  assert.ok(img);
  assert.ok(img.getAttribute("src").startsWith(`${PREFIX}/img/`));
  assert.doesNotMatch(body.toString(), /deleted-from-library|also-deleted/);
  const log = buildLog("pages-fixtures");
  assert.match(log, /\[images\].*rich-text\.md: image file not found: \/images\/deleted-from-library\.jpg/);
  assert.match(log, /\[images\].*rich-text\.md: image file not found: \/images\/also-deleted\.png/);
});

// ---------- 404 ----------

test("404 page exists with links to Home and Contact", () => {
  assert.ok(existsSync(path.join(out, "404.html")));
  const main = page("404.html").querySelector("main");
  const hrefs = main.querySelectorAll(".page-body a").map((a) => a.getAttribute("href"));
  assert.ok(hrefs.includes(`${PREFIX}/`), "Home");
  assert.ok(hrefs.includes(`${PREFIX}/contact/`), "Contact");
});

// ---------- Section title bar (one rule) ----------

test("section H2s on events and news posts use the shared .section-title bar", () => {
  const events = page("events/index.html").querySelectorAll("main h2");
  assert.ok(events.length && events.every((h) => h.classList.contains("section-title")));
  const css = readFileSync(path.join(root, "src/css/pages.css"), "utf8");
  assert.doesNotMatch(css, /border-left:\s*6px solid/, "pages.css repeats no gold-bar rule");
});

test("the gold bar is for section titles only, not H2s inside page bodies (DESIGN.md 8)", () => {
  const css = readFileSync(path.join(root, "src/css/components.css"), "utf8");
  const barRules = [...css.matchAll(/([^{}]+)\{[^}]*border-left:\s*6px solid var\(--color-surface-accent\)/g)].map((m) => m[1].trim());
  for (const selector of barRules) assert.doesNotMatch(selector, /\.prose|h2/, `gold bar on "${selector}"`);
  assert.ok(barRules.some((sel) => /^(\/\*[\s\S]*\*\/\s*)?\.section-title$/.test(sel)), ".section-title carries the bar");
  const body = fixture().querySelectorAll("main .page-body > h2");
  assert.ok(body.length && body.every((h) => !h.classList.contains("section-title")), "body H2s are plain");
  assert.ok(page("about/index.html").querySelector("main #in-section-heading").classList.contains("section-title"));
});
