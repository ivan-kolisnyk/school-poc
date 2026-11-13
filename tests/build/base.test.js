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
