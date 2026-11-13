import { test } from "node:test";
import assert from "node:assert/strict";
import { build, page } from "../helpers/build.js";

await build();

test("title ends with the official name and html lang is en", () => {
  const root = page("index.html");
  assert.match(root.querySelector("title").text.trim(), /Mary E\. Courtenay Language Arts Center$/);
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
  const cases = [
    ["index.html", "A neighborhood public school in Uptown where every child belongs."],
    ["families/preschool/index.html", "Full-day Pre-K for 3- and 4-year-olds at the Courtenay Child-Parent Center."],
    ["news/index.html", "A Chicago public school in Uptown for Pre-K to 8th grade."],
  ];
  for (const [file, description] of cases) {
    const root = page(file);
    assert.equal(root.querySelector('meta[name="description"]')?.getAttribute("content"), description, file);
    assert.equal(root.querySelector('meta[property="og:description"]')?.getAttribute("content"), description, file);
    assert.equal(root.querySelector('link[rel="icon"]')?.getAttribute("href"), "/school-poc/images/logo.png", file);
  }
});
