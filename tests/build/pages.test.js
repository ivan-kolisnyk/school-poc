// Inner pages, section navigation and migrated content (DESIGN.md 10.2, 10.4, 10.10, 13, 14, 16).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, page } from "../helpers/build.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const strings = JSON.parse(readFileSync(path.join(root, "src/_settings/strings.en.json"), "utf8"));
const site = JSON.parse(readFileSync(path.join(root, "src/_data/site.json"), "utf8"));
const text = (el) => el.text.replace(/\s+/g, " ").trim();
const PREFIX = "/school-poc";

const out = await build();

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

const CONTENT_PAGES = [
  "about/index.html",
  "about/mission/index.html",
  "about/principal/index.html",
  "about/tours/index.html",
  "about/lsc-pac/index.html",
  "about/volunteer/index.html",
  "families/index.html",
  "families/before-after-care/index.html",
  "families/payments/index.html",
  "families/preschool/index.html",
  "families/kindergarten-readiness/index.html",
  "families/athletics/index.html",
  "enroll/index.html",
  "contact/index.html",
  "404.html",
];

// ---------- Navigation ----------

test("dropdowns list each section's pages in order; Enroll and News have none", () => {
  const nav = page("index.html").querySelector("header nav");
  const sub = (key) => {
    const list = nav.querySelector(`#subnav-${key}`);
    return list ? list.querySelectorAll("a").map(text) : null;
  };
  assert.deepEqual(sub("about"), [
    "Mission and values", "A message from the principal", "Our staff", "Tours", "LSC & PAC", "Volunteer",
  ]);
  assert.deepEqual(sub("families"), [
    "Events", "CPS calendar", "Lunch menu", "Parent portal", "Before & after care",
    "Payments", "Preschool", "Kindergarten readiness", "Athletics",
  ]);
  assert.equal(sub("enroll"), null);
  assert.equal(sub("news"), null);
  assert.deepEqual(sub("contact"), ["Staff directory"]);
});

test("every nav link and dropdown child resolves (internal file or marked external https)", () => {
  const links = page("index.html").querySelectorAll("header nav a[href]");
  assert.ok(links.length >= 5 + 16, `found ${links.length} nav links`);
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
  assert.equal(href("Lunch menu"), site.links.lunchMenu);
  assert.equal(href("Parent portal"), site.links.parentPortal);
  assert.equal(href("CPS calendar"), site.links.cpsCalendar);
  assert.equal(href("Events"), `${PREFIX}/events/`);
  assert.equal(href("Our staff"), `${PREFIX}/staff/`);
  assert.equal(href("Staff directory"), `${PREFIX}/staff/`);
});

test("dropdown marks the current page; the section link is current for its children", () => {
  const nav = page("about/tours/index.html").querySelector("header nav");
  const current = nav.querySelectorAll(".site-nav__sub a[aria-current]");
  assert.deepEqual(current.map(text), ["Tours"]);
  assert.equal(current[0].getAttribute("aria-current"), "page");
  const top = nav.querySelectorAll(".site-nav__list > li > a[aria-current]");
  assert.deepEqual(top.map(text), ["About"]);
  assert.equal(top[0].getAttribute("aria-current"), "true");
});

test("menu-only entries build no page of their own", () => {
  for (const p of ["families/lunch-menu", "families/parent-portal", "families/cps-calendar", "families/events", "about/staff", "contact/staff-directory"]) {
    assert.equal(existsSync(path.join(out, p, "index.html")), false, p);
  }
});

// ---------- Every page ----------

test("every built page has exactly one h1 and no skipped heading levels", () => {
  const files = allHtml();
  assert.ok(files.length > 20);
  for (const file of files) {
    const doc = page(file);
    assert.equal(doc.querySelectorAll("h1").length, 1, `${file}: one h1`);
    let prev = 0;
    for (const h of doc.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
      const level = Number(h.tagName[1]);
      assert.ok(level <= prev + 1, `${file}: <${h.tagName.toLowerCase()}> "${text(h)}" follows h${prev}`);
      prev = level;
    }
  }
});

test("no page body carries stale school-year text", () => {
  for (const file of allHtml()) {
    const body = text(page(file).querySelector("main"));
    assert.doesNotMatch(body, /24-25|2024-2025/, file);
  }
});

test("content pages put their body in the reading column", () => {
  for (const file of CONTENT_PAGES) {
    const body = page(file).querySelector("main .page-body");
    assert.ok(body, `${file}: .page-body`);
    assert.ok(body.classList.contains("prose"), `${file}: reading column`);
  }
});

test("key pages exist and have real content", () => {
  for (const p of ["about/tours/index.html", "enroll/index.html", "families/preschool/index.html", "contact/index.html"]) {
    const body = page(p).querySelector("main .page-body");
    assert.ok(text(body).length > 200, `${p} is not empty`);
  }
});

test("src/about.md is gone; About is the section hub", () => {
  assert.equal(existsSync(path.join(root, "src/about.md")), false);
  assert.ok(existsSync(path.join(root, "src/about/index.md")));
});

// ---------- Page header (10.4) ----------

test("child page header: breadcrumb Home / section, H1, intro", () => {
  const doc = page("families/preschool/index.html");
  const header = doc.querySelector("main .page-header");
  assert.ok(header.classList.contains("on-dark"));
  const crumbs = header.querySelectorAll(".breadcrumb a");
  assert.deepEqual(crumbs.map(text), ["Home", "Families"]);
  assert.deepEqual(crumbs.map((a) => a.getAttribute("href")), [`${PREFIX}/`, `${PREFIX}/families/`]);
  assert.equal(text(header.querySelector("h1")), "Preschool");
  assert.ok(text(header.querySelector(".page-header__intro")).length > 10);
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
  assert.equal(page("enroll/index.html").querySelector("main .link-rows"), null, "Enroll has no children");
});

// ---------- Content body (10.10) ----------

test("external links in page bodies carry the external icon with a label", () => {
  const body = page("enroll/index.html").querySelector("main .page-body");
  const gocps = body.querySelectorAll("a").find((a) => /go\.cps\.edu/.test(a.getAttribute("href")));
  assert.equal(gocps.querySelector("svg.icon-external-link").getAttribute("aria-label"), strings.a11y.externalCps);
  const cel = body.querySelectorAll("a").find((a) => /chicagoearlylearning\.org/.test(a.getAttribute("href")));
  assert.equal(cel.querySelector("svg.icon-external-link").getAttribute("aria-label"), strings.a11y.external);
  const mail = body.querySelectorAll("a").find((a) => a.getAttribute("href") === "mailto:Courtenay_Tigers@cps.edu");
  assert.ok(mail, "enrollment email link");
  assert.equal(mail.querySelector("svg"), null, "mailto is not external");
});

test("callout shortcode renders a callout box with its markdown", () => {
  const callout = page("about/lsc-pac/index.html").querySelector("main .page-body .callout");
  assert.ok(callout);
  assert.match(text(callout), /Current agendas and minutes are available from the main office/);
  assert.ok(callout.querySelector("p"), "inner markdown rendered");
  assert.doesNotMatch(text(page("about/lsc-pac/index.html").querySelector("main")), /2023|2024/);
});

test("document link states file type; the old-host note is only an HTML comment", () => {
  const file = path.join(out, "families/kindergarten-readiness/index.html");
  const doc = page("families/kindergarten-readiness/index.html");
  const link = doc.querySelector("main .page-body a.doc-link");
  assert.ok(link);
  assert.match(link.getAttribute("href"), /courtenay\.cps\.edu\/.+Getting%20Ready\.pdf$/);
  assert.match(text(link), /Getting ready for kindergarten \(PDF/);
  assert.match(readFileSync(file, "utf8"), /<!--[^>]*File to be moved to the new site[^>]*-->/);
  assert.doesNotMatch(text(doc.querySelector("main")), /File to be moved/);
});

test("tours page ends with a primary Request a tour button to the Google Form", () => {
  assert.match(site.links.tourForm, /^https:\/\/docs\.google\.com\/forms\/d\/e\/1FAIpQLSf9c6Oc4DCoPNnolLfydLYnQLKi5ZlPWOKRQPcDAQNjbHNPqQ\/viewform$/);
  const body = page("about/tours/index.html").querySelector("main .page-body");
  const last = body.querySelectorAll("a").at(-1);
  assert.ok(last.classList.contains("btn--primary"));
  assert.equal(last.getAttribute("href"), site.links.tourForm);
  assert.match(text(last), /^Request a tour/);
});

test("contact page: address with directions, phone, fax, email, hours, map placeholder", () => {
  assert.equal(site.email, "Courtenay_Tigers@cps.edu");
  const body = page("contact/index.html").querySelector("main .page-body");
  const t = text(body);
  for (const fact of [site.address, site.phone, site.fax, site.hours, site.email]) assert.ok(t.includes(fact), fact);
  const directions = body.querySelectorAll("a").find((a) => /^Get directions/.test(text(a)));
  assert.match(directions.getAttribute("href"), /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
  assert.ok(body.querySelector("a[href^='tel:+1773534579']"));
  assert.ok(body.querySelector(`a[href='mailto:${site.email}']`));
  const ph = body.querySelector(".ph");
  assert.match(ph.getAttribute("aria-label"), /^Map placeholder: /);
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
  const body = page("enroll/index.html").querySelectorAll("main .page-body > h2");
  assert.ok(body.length && body.every((h) => !h.classList.contains("section-title")), "body H2s are plain");
  assert.ok(page("about/index.html").querySelector("main #in-section-heading").classList.contains("section-title"));
});

// ---------- Plain language (DESIGN.md 14): jargon spelled out where a page first uses it ----------

const JARGON = [
  ["LSC", /Local School Council \(LSC\)/],
  ["PAC", /Parent Advisory Council \(PAC\)/],
  ["CPC", /Child-Parent Center \(CPC\)/],
  ["ISBE", /Illinois State Board of Education \(ISBE\)/],
  ["SCORE", /SCORE, the after-school sports program of Chicago Public Schools/],
  ["GoCPS", /GoCPS, the CPS application and lottery website/],
];

test("jargon is spelled out at its first use on each content page", () => {
  for (const file of CONTENT_PAGES) {
    const main = page(file).querySelector("main");
    const intro = main.querySelector(".page-header__intro");
    const t = `${intro ? text(intro) : ""} ${text(main.querySelector(".page-body"))}`;
    for (const [abbr, expansion] of JARGON) {
      const first = t.search(new RegExp(`\\b${abbr}\\b`));
      if (first < 0) continue;
      const near = t.slice(Math.max(0, first - 60), first + 160);
      assert.match(near, expansion, `${file}: first "${abbr}" is explained`);
    }
  }
});

test("PAC page promises nothing the school has not confirmed", () => {
  const body = text(page("about/lsc-pac/index.html").querySelector("main .page-body"));
  assert.doesNotMatch(body, /calendar/i);
  assert.match(body, /PAC meeting notices and agendas are available from the main office/);
});
