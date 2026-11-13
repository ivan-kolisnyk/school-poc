import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, page } from "../helpers/build.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const strings = JSON.parse(readFileSync(path.join(root, "src/_settings/strings.en.json"), "utf8"));
const site = JSON.parse(readFileSync(path.join(root, "src/_data/site.json"), "utf8"));

const out = await build();

const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]";
const text = (el) => el.text.replace(/\s+/g, " ").trim();

test("skip link is the first focusable element and targets main#main", () => {
  const home = page("index.html");
  const first = home
    .querySelector("body")
    .querySelectorAll(FOCUSABLE)
    .find((el) => el.getAttribute("tabindex") !== "-1");
  assert.equal(first.tagName, "A");
  assert.ok(first.classList.contains("skip-link"));
  assert.equal(first.getAttribute("href"), "#main");
  assert.equal(text(first), strings.a11y.skipToContent);
  assert.ok(home.querySelector("main#main"));
});

test("header nav has exactly the five top-level items", () => {
  const links = page("index.html").querySelectorAll("header nav > ul > li > a");
  assert.deepEqual(links.map(text), ["About", "Families", "Enroll", "News & Events", "Contact"]);
});

test("nav.json is structure only; labels come from strings", () => {
  const nav = JSON.parse(readFileSync(path.join(root, "src/_data/nav.json"), "utf8"));
  assert.deepEqual(nav.map((i) => i.key), ["about", "families", "enroll", "news", "contact"]);
  for (const item of nav) {
    assert.deepEqual(Object.keys(item).sort(), ["key", "url"]);
    assert.equal(typeof strings.nav[item.key], "string", item.key);
  }
});

test("current section link carries aria-current", () => {
  const about = page("about/index.html").querySelectorAll("header nav > ul > li > a");
  const current = about.filter((a) => a.getAttribute("aria-current"));
  assert.deepEqual(current.map(text), ["About"]);
  assert.equal(current[0].getAttribute("aria-current"), "page");
});

test("menu button starts collapsed and controls an existing element", () => {
  const home = page("index.html");
  const btn = home.querySelector("header button[data-menu-toggle]");
  assert.ok(btn);
  assert.equal(btn.getAttribute("aria-expanded"), "false");
  const id = btn.getAttribute("aria-controls");
  assert.ok(id && home.querySelector(`#${id}`), `#${id} exists`);
});

test("search button is a labelled disclosure for an existing panel", () => {
  const home = page("index.html");
  const btn = home.querySelector("header button[data-search-toggle]");
  assert.ok(btn);
  assert.equal(btn.getAttribute("aria-expanded"), "false");
  assert.ok(home.querySelector(`#${btn.getAttribute("aria-controls")}`));
  assert.ok(text(btn).length > 0 || btn.getAttribute("aria-label"));
  const input = home.querySelector("#site-search input[name='q']");
  assert.equal(text(home.querySelector(`label[for='${input.getAttribute("id")}']`)), "Search Courtenay");
});

test("mobile menu repeats the six quick tasks at the bottom", () => {
  const home = page("index.html");
  const menu = home.querySelector(`#${home.querySelector("[data-menu-toggle]").getAttribute("aria-controls")}`);
  const tasks = menu.querySelectorAll(".quick-tasks a");
  assert.deepEqual(tasks.map(text), [
    "Calendar", "Lunch menu", "Parent portal", "Enroll", "Before & after care", "Contact",
  ]);
  assert.deepEqual(tasks.map((a) => a.getAttribute("href")), [
    "/school-poc/events/",
    site.links.lunchMenu,
    site.links.parentPortal,
    "/school-poc/enroll/",
    "/school-poc/families/before-after-care/",
    "/school-poc/contact/",
  ]);
});

test("header has no language switch", () => {
  assert.doesNotMatch(page("index.html").querySelector("header").text, /Español/);
});

test("header and footer are dark surfaces (gold focus rings)", () => {
  const home = page("index.html");
  assert.ok(home.querySelector("header").classList.contains("on-dark"));
  assert.ok(home.querySelector("footer").classList.contains("on-dark"));
});

test("logo is decorative and the wordmark is live text", () => {
  const header = page("index.html").querySelector("header");
  const img = header.querySelector("img");
  assert.equal(img.getAttribute("alt"), "");
  assert.equal(img.getAttribute("src"), "/school-poc/images/logo.png");
  assert.ok(Number(img.getAttribute("height")) <= 48);
  assert.ok(existsSync(path.join(out, "images/logo.png")));
  assert.match(header.text, /Courtenay Tigers/);
});

test("footer carries the contact block, Instagram, and a Staff group", () => {
  const footer = page("index.html").querySelector("footer");
  const t = text(footer);
  for (const [fact, value] of Object.entries({ name: site.name, address: site.address, phone: site.phone, fax: site.fax, hours: site.hours })) {
    assert.ok(t.includes(String(value).replace(/\s+/g, " ").trim()), fact);
  }

  const ig = footer.querySelectorAll("a").find((a) => a.getAttribute("href") === site.instagram);
  assert.ok(ig, "Instagram link");
  assert.equal(ig.getAttribute("aria-label") || text(ig), "Courtenay on Instagram");

  const groups = footer.querySelectorAll("h2, h3");
  const staff = groups.find((h) => text(h) === strings.footer.staffLinks);
  if (site.staffLinks?.length) {
    assert.ok(staff, "Staff heading");
    const staffLinks = staff.parentNode.querySelectorAll("a");
    assert.deepEqual(staffLinks.map(text), site.staffLinks.map((l) => String(l.label).trim()));
    assert.deepEqual(staffLinks.map((a) => a.getAttribute("href")), site.staffLinks.map((l) => l.url));
  } else {
    assert.equal(staff, undefined, "no empty Staff group");
  }

  for (const a of footer.querySelectorAll("a")) {
    assert.doesNotMatch(a.getAttribute("href"), /facebook\.com|twitter\.com|\/\/(www\.)?x\.com/);
  }
});

test("footer external links say which kind of site they open", () => {
  const footer = page("index.html").querySelector("footer");
  const external = footer.querySelectorAll("a").filter((a) => /^https?:/.test(a.getAttribute("href")) && a.querySelector("svg.icon-external-link"));
  assert.ok(external.length >= 3, "at least the three CPS links");
  for (const a of external) {
    const host = new URL(a.getAttribute("href")).hostname;
    const cps = host === "cps.edu" || host.endsWith(".cps.edu");
    const label = a.querySelector("svg.icon-external-link").getAttribute("aria-label");
    assert.equal(label, cps ? strings.a11y.externalCps : strings.a11y.external, `${host}: ${label}`);
  }
});

test("icons render as hidden inline SVG; site script is loaded", () => {
  const home = page("index.html");
  const icons = home.querySelectorAll("svg.icon");
  assert.ok(icons.length >= 3);
  for (const svg of icons) {
    const labelled = svg.getAttribute("role") === "img";
    if (!labelled) assert.equal(svg.getAttribute("aria-hidden"), "true");
  }
  assert.ok(home.querySelector("script[src='/school-poc/js/site.js']"));
  assert.ok(existsSync(path.join(out, "js/site.js")));
  assert.ok(home.querySelector("link[href='/school-poc/css/components.css']"));
});

test("the five self-hosted font files are published (DESIGN.md 6)", () => {
  const fonts = readdirSync(path.join(out, "fonts")).filter((f) => f.endsWith(".woff2")).sort();
  assert.deepEqual(fonts, [
    "barlow-latin-400-normal.woff2", "barlow-latin-500-normal.woff2", "barlow-latin-600-normal.woff2",
    "oswald-latin-500-normal.woff2", "oswald-latin-700-normal.woff2",
  ]);
  const tokens = readFileSync(path.join(out, "css/tokens.css"), "utf8");
  for (const f of fonts) assert.ok(tokens.includes(`../fonts/${f}`), `${f} referenced by tokens.css`);
});

test("the copyright year is the Chicago year, even when UTC has rolled over", async () => {
  await build({ name: "new-years-eve", env: { SITE_NOW: "2026-12-31T19:00:00-06:00" } }); // 01:00 UTC, Jan 1 2027
  assert.match(text(page("index.html", "new-years-eve").querySelector(".site-footer__base")), /^© 2026 /);
});

test("without JavaScript the search button is hidden at every width (it only opens the JS panel)", () => {
  const css = readFileSync(path.join(root, "src/css/components.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const at = css.search(/html:not\(\.js\) \[data-search-toggle\]\s*\{\s*display:\s*none;?\s*\}/);
  assert.ok(at >= 0, "html:not(.js) [data-search-toggle] { display: none }");
  let depth = 0;
  for (const ch of css.slice(0, at)) depth += ch === "{" ? 1 : ch === "}" ? -1 : 0;
  assert.equal(depth, 0, "the rule is not inside a media query");
});
