import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { nextHeadlines, newsDay, hasPhoto, photoIssue } from "../../lib/news.js";

// Newest first, as collections.newsDesc provides them.
const posts = ["/news/e/", "/news/d/", "/news/c/", "/news/b/", "/news/a/"].map((url) => ({ url }));
const urls = (list) => list.map((p) => p.url);

test("nextHeadlines: a middle post gets the next two older posts", () => {
  assert.deepEqual(urls(nextHeadlines(posts, "/news/d/")), ["/news/c/", "/news/b/"]);
});

test("nextHeadlines: the oldest post wraps around to the newest", () => {
  assert.deepEqual(urls(nextHeadlines(posts, "/news/a/")), ["/news/e/", "/news/d/"]);
  assert.deepEqual(urls(nextHeadlines(posts, "/news/b/")), ["/news/a/", "/news/e/"]);
});

test("nextHeadlines: a single post has no next headlines", () => {
  assert.deepEqual(nextHeadlines([{ url: "/news/a/" }], "/news/a/"), []);
});

test("nextHeadlines: two posts give one headline, never the current post", () => {
  const two = [{ url: "/news/b/" }, { url: "/news/a/" }];
  assert.deepEqual(urls(nextHeadlines(two, "/news/b/")), ["/news/a/"]);
  assert.deepEqual(urls(nextHeadlines(two, "/news/a/")), ["/news/b/"]);
});

test("nextHeadlines: n is configurable and empty input is safe", () => {
  assert.deepEqual(urls(nextHeadlines(posts, "/news/e/", 3)), ["/news/d/", "/news/c/", "/news/b/"]);
  assert.deepEqual(nextHeadlines([], "/news/a/"), []);
  assert.deepEqual(nextHeadlines(undefined, "/news/a/"), []);
});

test("newsDay: front-matter dates (UTC midnight) stay on their calendar day", () => {
  // Eleventy and YAML read `date: 2026-11-12` as 2026-11-12T00:00Z, which is Nov 11 in Chicago.
  assert.equal(newsDay(new Date("2026-11-12T00:00:00Z")), "2026-11-12");
  assert.equal(newsDay("2026-11-12"), "2026-11-12");
});

test("newsDay: a full timestamp is read as Chicago wall time", () => {
  assert.equal(newsDay(new Date("2026-11-13T03:30:00Z")), "2026-11-12");
  assert.equal(newsDay(new Date("2026-11-12T15:00:00Z")), "2026-11-12");
});

test("newsDay does not depend on the machine time zone", () => {
  for (const tz of ["UTC", "Pacific/Honolulu", "Asia/Tokyo"]) {
    const out = execFileSync(
      process.execPath,
      ["--input-type=module", "-e",
        `import { newsDay } from ${JSON.stringify(new URL("../../lib/news.js", import.meta.url).href)};
         process.stdout.write(newsDay(new Date("2026-11-12T00:00:00Z")));`],
      { env: { ...process.env, TZ: tz }, encoding: "utf8" }
    );
    assert.equal(out, "2026-11-12", tz);
  }
});

test("hasPhoto needs an image, its alt text and an existing file", () => {
  const yes = () => true;
  const no = () => false;
  assert.equal(hasPhoto({ image: "/images/a.jpg", image_alt: "Kids reading" }, yes), true);
  assert.equal(hasPhoto({ image: "/images/a.jpg", image_alt: "  " }, yes), false);
  assert.equal(hasPhoto({ image: "", image_alt: "Kids reading" }, yes), false);
  assert.equal(hasPhoto({ image: "/images/a.jpg", image_alt: "Kids reading" }, no), false);
  assert.equal(hasPhoto({}, yes), false);
});

test("photoIssue explains why a set image is not shown", () => {
  const no = () => false;
  assert.equal(photoIssue({}), null);
  assert.equal(photoIssue({ image: "/images/a.jpg", image_alt: "Kids" }, () => true), null);
  assert.match(photoIssue({ image: "/images/a.jpg" }), /image_alt/);
  assert.match(photoIssue({ image: "/images/a.jpg", image_alt: "Kids" }, no), /not found: \/images\/a\.jpg/);
});
