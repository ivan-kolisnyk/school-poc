import { test } from "node:test";
import assert from "node:assert/strict";
import { build, page } from "../helpers/build.js";
import { siteData, strings, home, sitePages, pageFile } from "../helpers/content.js";

await build();
const site = siteData();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("title ends with the official name and html lang is en", () => {
  const root = page("index.html");
  assert.match(root.querySelector("title").text.trim(), new RegExp(` · ${escapeRe(site.name)}$`));
  assert.equal(root.querySelector("html").getAttribute("lang"), "en");
});

test("site-relative URLs carry the path prefix", () => {
  const root = page("index.html");
  const urls = [
    ...root.querySelectorAll("link[href]").map((e) => e.getAttribute("href")),
    ...root.querySelectorAll("script[src]").map((e) => e.getAttribute("src")),
    ...root.querySelectorAll("img[src]").map((e) => e.getAttribute("src")),
  ].filter((u) => u.startsWith("/") && !u.startsWith("//"));
  assert.ok(urls.length > 0);
  for (const u of urls) assert.ok(u.startsWith("/school-poc/"), u);
});

test("anchors are prefixed too", () => {
  const root = page("index.html");
  for (const a of root.querySelectorAll("a[href^='/']")) {
    assert.ok(a.getAttribute("href").startsWith("/school-poc/"), a.getAttribute("href"));
  }
});

test("every page has a description and an icon for search results and shared links", () => {
  // The homepage's supporting line, a content page's intro, else the site's own description.
  const withIntro = sitePages().find((p) => p.url && p.data.layout === "layouts/page.njk" && String(p.data.intro ?? "").trim());
  const cases = [
    ["index.html", String(home().data.hero_sub ?? "").trim() || strings().meta.description],
    ["news/index.html", strings().meta.description],
    ...(withIntro ? [[pageFile(withIntro.url), String(withIntro.data.intro).trim()]] : []),
  ];
  for (const [file, description] of cases) {
    const root = page(file);
    assert.equal(root.querySelector('meta[name="description"]')?.getAttribute("content"), description, file);
    assert.equal(root.querySelector('meta[property="og:description"]')?.getAttribute("content"), description, file);
    assert.equal(root.querySelector('link[rel="icon"]')?.getAttribute("href"), "/school-poc/images/logo.png", file);
  }
});
