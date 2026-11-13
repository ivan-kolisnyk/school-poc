import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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
  assert.match(t, /Mary E\. Courtenay Language Arts Center/);
  assert.match(t, /4420 N\. Beacon St\./);
  assert.ok(t.includes(site.phone), "phone");
  assert.ok(t.includes("(773) 534-5799"), "fax");
  assert.ok(t.includes(site.hours), "hours");

  const ig = footer.querySelectorAll("a").find((a) => a.getAttribute("href") === "https://www.instagram.com/courtenaytigers/");
  assert.ok(ig, "Instagram link");
  assert.equal(ig.getAttribute("aria-label") || text(ig), "Courtenay on Instagram");

  const groups = footer.querySelectorAll("h2, h3");
  const staff = groups.find((h) => /^Staff/.test(text(h)));
  assert.ok(staff, "Staff heading");
  const staffLinks = staff.parentNode.querySelectorAll("a").map(text);
  for (const label of ["Frontline", "Aspen", "Kronos"]) {
    assert.ok(staffLinks.some((l) => l.includes(label)), label);
  }

  for (const a of footer.querySelectorAll("a")) {
    assert.doesNotMatch(a.getAttribute("href"), /facebook\.com|twitter\.com|\/\/(www\.)?x\.com/);
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
