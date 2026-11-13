import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, page, buildLog } from "../helpers/build.js";
import { newsPosts, showsPhoto } from "../helpers/content.js";
import { formatDate } from "../../lib/dates.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const strings = JSON.parse(readFileSync(path.join(root, "src/_settings/strings.en.json"), "utf8"));
const text = (el) => el.text.replace(/\s+/g, " ").trim();
const PREFIX = "/school-poc";

const realPosts = newsPosts();
const fixturePosts = newsPosts("tests/fixtures/news");
const PER_PAGE = 12;
const listPages = (n) => Math.max(1, Math.ceil(n / PER_PAGE));
const listFile = (i) => (i === 0 ? "news/index.html" : `news/${i + 1}/index.html`);

const out = await build();
await build({ name: "news-fixtures", env: { NEWS_FIXTURES_DIR: "tests/fixtures/news" } });

const cardsOn = (p, variant) => page(p, variant).querySelectorAll("main .news-card");
const cardHref = (card) => card.querySelector(".news-card__link").getAttribute("href");
/** Every card on every list page, in order. */
const allCards = (n, variant) => Array.from({ length: listPages(n) }, (_, i) => cardsOn(listFile(i), variant)).flat();

test("every post has the fields the CMS requires, with a date-only Date", () => {
  for (const post of realPosts) {
    for (const key of ["title", "date", "summary"]) assert.ok(String(post.data[key] ?? "").trim(), `${post.file}: ${key}`);
    assert.match(String(post.data.date), /^\d{4}-\d{2}-\d{2}$/, `${post.file}: date-only`);
  }
});

test("each post has its own page with one sentence-case h1 and the date in post format", () => {
  for (const { slug, data } of realPosts) {
    const post = { slug, title: String(data.title).trim(), date: String(data.date) };
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
  const doc = page("news/photo-without-alt/index.html", "news-fixtures");
  assert.equal(text(doc.querySelector(".page-header time")), "June 1, 2026");
  assert.equal(doc.querySelector(".page-header time").getAttribute("datetime"), "2026-06-01");
});

test("a post ends with an All news link and the next two headlines, wrapping to the newest", () => {
  const order = allCards(realPosts.length).map(cardHref);
  assert.equal(order.length, realPosts.length);
  order.forEach((href, i) => {
    const doc = page(href.replace(`${PREFIX}/`, "") + "index.html");
    const all = doc.querySelectorAll("main a").filter((a) => text(a) === strings.news.allNews);
    assert.equal(all.length, 1, `${href}: one "All news" link`);
    assert.equal(all[0].getAttribute("href"), `${PREFIX}/news/`);
    const more = doc.querySelectorAll(".post-more .news-card__link").map((a) => a.getAttribute("href"));
    const n = Math.min(2, order.length - 1); // fewer when there are fewer other posts
    const expected = Array.from({ length: n }, (_, k) => order[(i + k + 1) % order.length]);
    assert.deepEqual(more, expected, href);
    assert.ok(!more.includes(href), `${href}: never links to itself`);
    // Heading levels go down one at a time: h1 title, h2 "More news", h3 cards.
    if (n) assert.equal(text(doc.querySelector(".post-more h2")), strings.news.moreNews);
    else assert.equal(doc.querySelector(".post-more"), null, "no empty More news section");
    assert.equal(doc.querySelectorAll(".post-more h3").length, n);
  });
});

test("/news/ lists every post as a card, newest first, 12 per page", () => {
  const doc = page("news/index.html");
  assert.equal(doc.querySelectorAll("h1").length, 1);
  assert.equal(text(doc.querySelector("h1")), strings.news.heading);
  const cards = allCards(realPosts.length);
  assert.equal(cards.length, realPosts.length);
  const days = cards.map((c) => c.querySelector("time").getAttribute("datetime"));
  assert.deepEqual(days, [...days].sort().reverse(), "newest first");
  for (let i = 0; i < listPages(realPosts.length); i++) {
    // Card titles are h2 under the page h1.
    const n = cardsOn(listFile(i)).length;
    assert.equal(page(listFile(i)).querySelectorAll("main .news-card h2").length, n);
    assert.ok(n >= 1 && n <= PER_PAGE, `${listFile(i)} has ${n} cards`);
  }
  for (const card of cards) {
    const time = card.querySelector(".news-card__date time");
    assert.equal(text(time), formatDate(time.getAttribute("datetime"), "card"));
  }
  // Pagination follows the post count: no empty extra page, and the nav only when needed.
  const pages = listPages(realPosts.length);
  assert.ok(!existsSync(path.join(out, listFile(pages))), `no page ${pages + 1}`);
  assert.equal(doc.querySelectorAll("main .pagination").length, pages > 1 ? 1 : 0);
});

test("a card and its post show the photo exactly when the post has a photo, alt text and the file", () => {
  const cards = allCards(realPosts.length);
  for (const post of realPosts) {
    const card = cards.find((c) => cardHref(c) === `${PREFIX}/news/${post.slug}/`);
    const photo = showsPhoto(post.data.image, post.data.image_alt);
    assert.equal(card.classList.contains("news-card--photo"), photo, post.file);
    assert.equal(card.classList.contains("news-card--text"), !photo, post.file);
    assert.equal(card.querySelectorAll("img").length > 0, photo, post.file);
    const doc = page(`news/${post.slug}/index.html`);
    assert.equal(Boolean(doc.querySelector("main .post__photo img")), photo, post.file);
  }
  // The build warns about exactly the posts whose photo is set but cannot show.
  const warned = new Set([...buildLog().matchAll(/\[news\] \S*?([^/\s]+\.md):/g)].map((m) => m[1]));
  const expected = new Set(realPosts.filter((p) => String(p.data.image ?? "").trim() && !showsPhoto(p.data.image, p.data.image_alt)).map((p) => p.file));
  assert.deepEqual([...warned].sort(), [...expected].sort());
});

test("13+ posts paginate at 12 per page", () => {
  const total = realPosts.length + fixturePosts.length;
  assert.ok(fixturePosts.length > PER_PAGE, "the fixtures alone need a second page, however many real posts there are");
  const pages = listPages(total);
  for (let i = 0; i < pages; i++) {
    const n = cardsOn(listFile(i), "news-fixtures").length;
    assert.equal(n, i < pages - 1 ? PER_PAGE : total - PER_PAGE * (pages - 1), listFile(i));
    assert.equal(page(listFile(i), "news-fixtures").querySelectorAll("h1").length, 1);
  }
  const nav = page("news/index.html", "news-fixtures").querySelector("main nav.pagination");
  assert.ok(nav, "pagination nav on page 1");
  assert.ok(nav.querySelectorAll("a").some((a) => a.getAttribute("href") === `${PREFIX}/news/2/`));
  const back = page("news/2/index.html", "news-fixtures").querySelector("main nav.pagination");
  assert.ok(back.querySelectorAll("a").some((a) => a.getAttribute("href") === `${PREFIX}/news/`));
});

function fixtureCard(slug) {
  const card = allCards(realPosts.length + fixturePosts.length, "news-fixtures").find((c) => cardHref(c) === `${PREFIX}/news/${slug}/`);
  if (!card) throw new Error(`no card for ${slug}`);
  return card;
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
});

test("a missing image file falls back to the text-only card, warns, and does not fail the build", () => {
  const card = fixtureCard("missing-image");
  assert.ok(card.classList.contains("news-card--text"));
  assert.equal(card.querySelectorAll("img, picture").length, 0);
  const post = page("news/missing-image/index.html", "news-fixtures");
  assert.equal(post.querySelectorAll("main .post img, main .post picture").length, 0);
  assert.equal(post.querySelectorAll("main .post__photo").length, 0);
  const log = buildLog("news-fixtures");
  assert.match(log, /2026-06-04-missing-image\.md/);
  assert.match(log, /\/images\/news\/does-not-exist\.jpg/);
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
  const long = fixturePosts.find((p) => p.slug === "long-title").data.title;
  assert.equal(long.length, 120);
  const link = fixtureCard("long-title").querySelector(".news-card__link");
  assert.equal(text(link), long);
});

test("home page still builds and links to post pages", () => {
  const links = page("index.html").querySelectorAll("main .news-card__link");
  assert.ok(links.length > 0 && links.length <= 3);
  for (const a of links) assert.match(a.getAttribute("href"), /^\/school-poc\/news\/[a-z0-9-]+\/$/);
});

test("a story's pasted headings are re-levelled under the title (one h1, no skipped level)", () => {
  const doc = page("news/rich-story/index.html", "news-fixtures");
  assert.equal(doc.querySelectorAll("h1").length, 1);
  assert.deepEqual(doc.querySelectorAll("main .post h2, main .post h3, main .post h4").map((h) => [h.tagName, text(h)]),
    [["H2", "Thank you, families"], ["H3", "Totals"]]);
});

test("an inline story image goes through the image pipeline; a missing one is left out with a warning", () => {
  const post = page("news/rich-story/index.html", "news-fixtures").querySelector("main .post");
  const img = post.querySelector('picture img[alt="Courtenay tiger shield"]');
  assert.ok(img, "the existing inline image is a responsive picture");
  assert.ok(img.getAttribute("src").startsWith(`${PREFIX}/img/`));
  assert.doesNotMatch(post.toString(), /deleted-inline/);
  assert.match(buildLog("news-fixtures"), /\[images\].*2026-06-05-rich-story\.md.*\/images\/news\/deleted-inline\.jpg/);
});

test("story text that looks like template code is shown as text", () => {
  const post = page("news/rich-story/index.html", "news-fixtures").querySelector("main .post");
  assert.match(text(post), /Type \{\{ braces \}\} or \{% this %\} in a story and it stays text\./);
});

test("a photo file name the browser cannot decode falls back to the text-only card and warns", () => {
  const card = fixtureCard("bad-file-name");
  assert.ok(card.classList.contains("news-card--text"));
  assert.equal(card.querySelectorAll("img, picture").length, 0);
  assert.match(buildLog("news-fixtures"), /\[news\].*2026-06-06-bad-file-name\.md.*image file not found: \/images\/news\/50% off\.jpg/);
});
