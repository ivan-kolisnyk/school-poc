// Search (DESIGN.md 10.0, 10.13): Pagefind index, /search/ page, header field.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, page } from "../helpers/build.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const strings = JSON.parse(readFileSync(path.join(root, "src/_settings/strings.en.json"), "utf8"));
const out = await build();
const doc = page("search/index.html");

test("Pagefind index is built into the prefixed site", () => {
  assert.ok(existsSync(path.join(out, "pagefind/pagefind.js")));
  assert.ok(readdirSync(path.join(out, "pagefind")).some((f) => f.endsWith(".pf_meta")));
});

test("/search/ has a labeled input and a polite live results region", () => {
  const input = doc.querySelector("main input[name='q']");
  assert.ok(input);
  const label = doc.querySelector(`main label[for="${input.id}"]`);
  assert.equal(label.text.trim(), strings.search.label);
  const live = doc.querySelector('main [aria-live="polite"]');
  assert.ok(live);
  assert.ok(doc.querySelector("main [data-search-results]"));
});

test("search script is loaded from the prefixed path; no-JS fallback is present", () => {
  const html = doc.toString();
  assert.match(html, /\/school-poc\/pagefind\/pagefind\.js/);
  const fallback = doc.querySelector("main .search-nojs");
  assert.ok(fallback);
  const hrefs = fallback.querySelectorAll("a").map((a) => a.getAttribute("href"));
  assert.deepEqual(hrefs, ["/school-poc/news/", "/school-poc/families/", "/school-poc/contact/"]);
});

test("/search/ and /404.html are not indexed; content pages are", () => {
  assert.ok(!doc.querySelector("[data-pagefind-body]"));
  assert.ok(!page("404.html").querySelector("[data-pagefind-body]"));
  assert.ok(page("index.html").querySelector("main[data-pagefind-body]"));
  assert.ok(page("contact/index.html").querySelector("main[data-pagefind-body]"));
});

test("no-results copy comes from strings and names the query slot", () => {
  assert.match(strings.search.none, /No results for/);
  assert.match(doc.toString(), /data-none="/);
});

test("header search form submits GET to /search/ with field q on every page", () => {
  const form = page("contact/index.html").querySelector("header form[role='search']");
  assert.equal(form.getAttribute("action"), "/school-poc/search/");
  assert.equal(form.getAttribute("method"), "get");
  assert.ok(form.querySelector("input[name='q']"));
});
