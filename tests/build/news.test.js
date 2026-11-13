import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { build, page, buildLog } from "../helpers/build.js";
import { formatDate } from "../../lib/dates.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const strings = JSON.parse(readFileSync(path.join(root, "src/_settings/strings.en.json"), "utf8"));
const text = (el) => el.text.replace(/\s+/g, " ").trim();
const PREFIX = "/school-poc";

function readPosts(dir) {
  return readdirSync(path.join(root, dir))
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const fm = readFileSync(path.join(root, dir, file), "utf8").split(/^---$/m)[1];
      const data = parseYaml(fm, { schema: "failsafe" }); // keep dates as the strings editors typed
      return { file, slug: file.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, ""), ...data };
    });
}

const realPosts = readPosts("src/news");
const fixturePosts = readPosts("tests/fixtures/news");

const out = await build();
await build({ name: "news-fixtures", env: { NEWS_FIXTURES_DIR: "tests/fixtures/news" } });

const cardsOn = (p, variant) => page(p, variant).querySelectorAll("main .news-card");
const cardHref = (card) => card.querySelector(".news-card__link").getAttribute("href");

test("news has the migrated posts plus the two samples", () => {
  assert.ok(realPosts.length >= 7, `expected at least 7 posts, found ${realPosts.length}`);
  for (const post of realPosts) {
    for (const key of ["title", "date", "summary"]) assert.ok(post[key], `${post.file}: ${key}`);
    assert.match(post.date, /^\d{4}-\d{2}-\d{2}$/, `${post.file}: date-only`);
    assert.ok(post.file.startsWith(post.date), `${post.file}: file name starts with the date`);
  }
});

test("each post has its own page with one sentence-case h1 and the date in post format", () => {
  for (const post of realPosts) {
    const file = path.join(out, "news", post.slug, "index.html");
    assert.ok(existsSync(file), `/news/${post.slug}/ exists`);
    const doc = page(`news/${post.slug}/index.html`);
    const h1s = doc.querySelectorAll("h1");
    assert.equal(h1s.length, 1, post.slug);
    assert.equal(text(h1s[0]), post.title);
    assert.ok(h1s[0].classList.contains("sentence-case"), `${post.slug}: h1 is never uppercased`);
    const time = doc.querySelector(".page-header time");
    assert.equal(time.getAttribute("datetime"), post.date, post.slug);
    assert.equal(text(time), formatDate(post.date, "post"), post.slug);
    assert.match(doc.querySelector("title").text, new RegExp(post.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("post dates never shift a day under a UTC build", () => {
  const doc = page("news/new-library-hours/index.html");
  assert.equal(text(doc.querySelector(".page-header time")), "September 14, 2026");
});

test("a post ends with an All news link and the next two headlines, wrapping to the newest", () => {
  const order = cardsOn("news/index.html").map(cardHref);
  assert.equal(order.length, realPosts.length);
  order.forEach((href, i) => {
    const doc = page(href.replace(`${PREFIX}/`, "") + "index.html");
    const all = doc.querySelectorAll("main a").filter((a) => text(a) === strings.news.allNews);
    assert.equal(all.length, 1, `${href}: one "All news" link`);
    assert.equal(all[0].getAttribute("href"), `${PREFIX}/news/`);
    const more = doc.querySelectorAll(".post-more .news-card__link").map((a) => a.getAttribute("href"));
    const expected = [order[(i + 1) % order.length], order[(i + 2) % order.length]];
    assert.deepEqual(more, expected, href);
    assert.ok(!more.includes(href), `${href}: never links to itself`);
    // Heading levels go down one at a time: h1 title, h2 "More news", h3 cards.
    assert.equal(text(doc.querySelector(".post-more h2")), strings.news.moreNews);
    assert.equal(doc.querySelectorAll(".post-more h3").length, 2);
  });
});

test("/news/ lists every post as a card, newest first", () => {
  const doc = page("news/index.html");
  assert.equal(doc.querySelectorAll("h1").length, 1);
  assert.equal(text(doc.querySelector("h1")), strings.news.heading);
  const cards = cardsOn("news/index.html");
  assert.equal(cards.length, realPosts.length);
  const days = cards.map((c) => c.querySelector("time").getAttribute("datetime"));
  assert.deepEqual(days, [...days].sort().reverse(), "newest first");
  // Card titles are h2 under the page h1.
  assert.equal(doc.querySelectorAll("main .news-card h2").length, realPosts.length);
  for (const card of cards) {
    const time = card.querySelector(".news-card__date time");
    assert.equal(text(time), formatDate(time.getAttribute("datetime"), "card"));
  }
  assert.ok(!existsSync(path.join(out, "news", "2", "index.html")), "no second page under 13 posts");
  assert.equal(doc.querySelectorAll("main .pagination").length, 0, "no pagination for one page");
});

test("posts without photos render the text-only card and no image", () => {
  for (const card of cardsOn("news/index.html")) {
    assert.ok(card.classList.contains("news-card--text"));
    assert.equal(card.querySelectorAll("img").length, 0);
  }
});

test("13+ posts paginate at 12 per page", () => {
  const total = realPosts.length + fixturePosts.length;
  assert.ok(total > 12);
  const first = cardsOn("news/index.html", "news-fixtures");
  const second = cardsOn("news/2/index.html", "news-fixtures");
  assert.equal(first.length, 12);
  assert.equal(second.length, total - 12);
  const nav = page("news/index.html", "news-fixtures").querySelector("main nav.pagination");
  assert.ok(nav, "pagination nav on page 1");
  assert.ok(nav.querySelectorAll("a").some((a) => a.getAttribute("href") === `${PREFIX}/news/2/`));
  const back = page("news/2/index.html", "news-fixtures").querySelector("main nav.pagination");
  assert.ok(back.querySelectorAll("a").some((a) => a.getAttribute("href") === `${PREFIX}/news/`));
  assert.equal(page("news/2/index.html", "news-fixtures").querySelectorAll("h1").length, 1);
});

function fixtureCard(slug) {
  const pages = ["news/index.html", "news/2/index.html"];
  for (const p of pages) {
    const card = cardsOn(p, "news-fixtures").find((c) => cardHref(c) === `${PREFIX}/news/${slug}/`);
    if (card) return card;
  }
  throw new Error(`no card for ${slug}`);
}

test("a photo without alt text falls back to the text-only card and warns", () => {
  const card = fixtureCard("photo-without-alt");
  assert.ok(card.classList.contains("news-card--text"));
  assert.ok(!card.classList.contains("news-card--photo"));
  assert.equal(card.querySelectorAll("img, picture").length, 0);
  const post = page("news/photo-without-alt/index.html", "news-fixtures");
  assert.equal(post.querySelectorAll("main img").length, 0);
  const log = buildLog("news-fixtures");
  assert.match(log, /2026-06-01-photo-without-alt\.md/);
  assert.match(log, /image_alt/);
  assert.doesNotMatch(buildLog(), /image_alt/, "real posts raise no warning");
});

test("a photo with alt text goes through the image pipeline", () => {
  const card = fixtureCard("photo-with-alt");
  assert.ok(card.classList.contains("news-card--photo"));
  const picture = card.querySelector("picture");
  assert.ok(picture, "picture element");
  const types = picture.querySelectorAll("source").map((s) => s.getAttribute("type"));
  assert.deepEqual(types, ["image/avif", "image/webp"]);
  const img = picture.querySelector("img");
  assert.equal(img.getAttribute("alt"), "Courtenay tiger shield");
  assert.equal(img.getAttribute("loading"), "lazy");
  assert.equal(img.getAttribute("decoding"), "async");
  assert.match(img.getAttribute("width"), /^\d+$/);
  assert.match(img.getAttribute("height"), /^\d+$/);
  assert.ok(img.getAttribute("src").startsWith(`${PREFIX}/img/`), img.getAttribute("src"));
  for (const s of picture.querySelectorAll("source")) {
    assert.ok(s.getAttribute("srcset").startsWith(`${PREFIX}/img/`));
    assert.ok(s.getAttribute("sizes"));
  }
  const post = page("news/photo-with-alt/index.html", "news-fixtures");
  const photo = post.querySelector("main .post__photo img");
  assert.ok(photo, "post shows its photo");
  assert.equal(photo.getAttribute("alt"), "Courtenay tiger shield");
});

test("a 120-character title renders in full in the card link", () => {
  const long = fixturePosts.find((p) => p.slug === "long-title");
  assert.equal(long.title.length, 120);
  const link = fixtureCard("long-title").querySelector(".news-card__link");
  assert.equal(text(link), long.title);
});

test("home page still builds and links to post pages", () => {
  const links = page("index.html").querySelectorAll("main .news-card__link");
  assert.ok(links.length > 0 && links.length <= 3);
  for (const a of links) assert.match(a.getAttribute("href"), /^\/school-poc\/news\/[a-z0-9-]+\/$/);
});
