// Regression for the final review's C1: routine Pages CMS saves must never block publishing.
// The deploy runs `npm test`; its gating part (`npm run test:gating`: tests/unit + tests/build)
// must pass whatever editors save. This test copies the repo, makes the edits the README and the
// CMS help text ask for (and a few careless ones) the way Pages CMS writes them, runs the gating
// suite inside the copy, and then checks the copy's own build really shows those edits.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync, copyFileSync, mkdirSync, realpathSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { build, page, buildLog } from "../helpers/build.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const cms = parseYaml(readFileSync(path.join(root, ".pages.yml"), "utf8"));
const text = (el) => el.text.replace(/\s+/g, " ").trim();
const PREFIX = "/school-poc";

// ---------- The copy ----------

const SKIP = new Set(["node_modules", ".git", "_site", "_site_es", "_test_site", ".cache", "test-results",
  "playwright-report", "playwright-report-es", ".superpowers", ".agents", ".claude", "docs"]);
const copy = realpathSync(mkdtempSync(path.join(os.tmpdir(), "courtenay-cms-edits-")));
after(() => rmSync(copy, { recursive: true, force: true }));
cpSync(root, copy, {
  recursive: true,
  filter: (from) => !SKIP.has(path.relative(root, from).split(path.sep)[0]),
});
symlinkSync(path.join(root, "node_modules"), path.join(copy, "node_modules"), "dir");

// A calendar feed an admin pasted in: a local server that counts requests, so the test proves
// the gating suite never fetches the feed.
let feedRequests = 0;
const feed = createServer((req, res) => {
  feedRequests++;
  res.writeHead(500).end();
});
await new Promise((resolve) => feed.listen(0, "127.0.0.1", resolve));
after(() => feed.close());

// ---------- CMS-shaped writes: only fields .pages.yml offers for that entry ----------

const entry = (name) => cms.content.find((e) => e.name === name);
const fieldNames = (name) => entry(name).fields.map((f) => f.name);
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function splitFile(file) {
  const raw = readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return { data: parseYaml(m[1]), body: m[2] };
}
function writeEntry(file, data, body) {
  writeFileSync(file, `---\n${stringifyYaml(data)}---\n${body}`);
}
/** Edit fields of an existing CMS entry; `body` is the rich-text field (omit to keep it). */
function cmsEdit(name, rel, changes, body) {
  const allowed = fieldNames(name);
  for (const k of Object.keys(changes)) assert.ok(allowed.includes(k), `.pages.yml ${name} has no field "${k}"`);
  const file = path.join(copy, rel);
  const current = splitFile(file);
  writeEntry(file, { ...current.data, ...changes }, body ?? current.body);
}
/** A new entry in a CMS collection, named by the collection's `filename` pattern. */
function cmsCreate(name, data, body = "", { created = "2026-11-13" } = {}) {
  const e = entry(name);
  const allowed = fieldNames(name);
  for (const k of Object.keys(data)) assert.ok(allowed.includes(k), `.pages.yml ${name} has no field "${k}"`);
  for (const f of e.fields.filter((x) => x.required)) assert.ok(f.name in data, `${name}: required field ${f.name}`);
  const [year, month, day] = created.split("-");
  const primary = slugify(String(data[e.view?.primary ?? "title"]));
  // Pages CMS names a new entry {year}-{month}-{day}-{primary}.md unless the collection says otherwise.
  const fileName = (e.filename ?? "{year}-{month}-{day}-{primary}.md")
    .replace("{year}", year).replace("{month}", month).replace("{day}", day).replace("{primary}", primary);
  // Hidden fields with a default are written by the CMS on create.
  const hidden = Object.fromEntries(e.fields.filter((f) => f.hidden && "default" in f).map((f) => [f.name, f.default]));
  writeEntry(path.join(copy, e.path, fileName), { ...hidden, ...data }, body);
  return fileName;
}
function upload(name) {
  mkdirSync(path.join(copy, "src/images/uploads"), { recursive: true });
  copyFileSync(path.join(root, "src/images/logo.png"), path.join(copy, "src/images/uploads", name));
  return `${cms.media.output}/uploads/${name}`;
}

const heroPhoto = upload("hero.png");
const newsPhoto = upload("book-fair.png");
const staffPhoto = upload("new-teacher.png");

// Homepage: a new (long) headline, the real pride numbers the README asks for, a new welcome.
cmsEdit("home", "src/index.md", {
  hero_heading: "Welcome to Courtenay, a school where every",
  hero_highlight: "child belongs.",
  hero_image: heroPhoto,
  hero_alt: "Students reading together in the library",
  pride: [
    { value: "412", label: "Students" },
    { value: "K–8", label: "Grades" },
    { value: "14:1", label: "Students per teacher" },
  ],
  welcome_title: "Hello from our principal",
  welcome_link: "https://www.cps.edu/",
}, "# Welcome back\n\nWe are glad you are here.\n\n#### See you soon\n\nThe principal\n");

// News: back-dated posts until the list needs a second page, one with a photo and an inline
// image, one with template-looking text, one with an inline image that was later deleted.
const posts = [
  { title: "Book fair thank you", date: "2026-11-02", summary: "Thank you for a great book fair.",
    image: newsPhoto, image_alt: "Students choosing books at the fair",
    body: `# Thank you!\n\n![Students at the fair](${newsPhoto})\n\n#### Totals\n\nWe raised money for the library.\n` },
  { title: "Math night", date: "2026-10-01", summary: "Families played math games.",
    body: "Use {{ braces }} and {% raw %} in a story: it is only text.\n" },
  { title: "Old photo story", date: "2026-08-01", summary: "A story whose photo was deleted.",
    body: "![Gone](/images/uploads/deleted-photo.jpg)\n\nThe photo was removed from the media library.\n" },
  { title: "Picture day", date: "2026-09-30", summary: "Picture day is coming." },
  { title: "Coat drive", date: "2026-10-15", summary: "Bring a coat for a neighbor." },
  { title: "Science fair winners", date: "2026-03-20", summary: "Congratulations to our winners." },
];
for (const { body = "Story text.\n", ...data } of posts) cmsCreate("news", data, body);

// Staff: an email for the principal, a new teacher with a photo.
cmsEdit("staff", "src/staff/people/keri-mendez.md", { email: "kmendez@cps.edu" });
cmsCreate("staff", { name: "Ms. New Teacher", role: "Teacher", group: "K–2", email: "newteacher@cps.edu",
  photo: staffPhoto, photo_alt: "Ms. New Teacher smiling" });

// Pages: a new About page, a renamed one, a deleted Families page, a rich-text body saved as
// HTML with an H1 and an H4, and an inline image in a page body.
cmsCreate("about", { title: "Our history", intro: "How Courtenay began.", order: 2 }, "<h1>Our history</h1><p>Courtenay opened long ago.</p><h4>Today</h4><p>We keep growing.</p>");
cmsEdit("about", "src/about/tours.md", { title: "Visit us" });
unlinkSync(path.join(copy, "src/families/athletics.md"));
cmsEdit("enroll", "src/enroll/index.md", { intro: "Enroll today." },
  "<h1>Enroll now</h1><p>Call the office.</p><h4>Documents</h4><p>Bring proof of address.</p>\n");
cmsEdit("about", "src/about/principal.md", {}, `![Principal Mendez](${staffPhoto})\n\nDear families, welcome!\n`);

// School details: the calendar feed address, new hours, a changed staff link list.
const site = JSON.parse(readFileSync(path.join(copy, "src/_data/site.json"), "utf8"));
for (const k of ["calendarIcs", "hours", "staffLinks"]) assert.ok(fieldNames("site").includes(k));
site.calendarIcs = `http://127.0.0.1:${feed.address().port}/calendar.ics`;
site.hours = "Mon–Fri, 7:45 am – 3:45 pm";
site.staffLinks = [{ label: "Frontline", url: "https://login.frontlineeducation.com/" }];
writeFileSync(path.join(copy, "src/_data/site.json"), JSON.stringify(site, null, 2));

// Alert: a relative link (no leading slash) and an end time with stray spaces.
const alert = JSON.parse(readFileSync(path.join(copy, "src/_settings/alert.json"), "utf8"));
writeFileSync(path.join(copy, "src/_settings/alert.json"), JSON.stringify({
  ...alert, show: true, level: "notice", message: "Picture day is Friday.", link: "news/", start: "", end: " 2026-11-20T15:00 ",
}, null, 2));

// ---------- The gating suite passes on the edited copy ----------

test("the deploy-gating suite passes after routine CMS edits", { timeout: 300000 }, async () => {
  assert.ok(pkg.scripts["test:gating"], "package.json defines test:gating");
  assert.match(pkg.scripts.test, /tests\/unit/);
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT; // run as a top-level test run, not as a child of this one
  const { code, output } = await new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "--silent", "test:gating"], { cwd: copy, env, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (d) => (output += d));
    child.stderr.on("data", (d) => (output += d));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, output }));
  });
  const failures = output.split("\n").filter((l) => /^\s*✖|not ok|Error|AssertionError/.test(l)).slice(0, 40).join("\n");
  assert.equal(code, 0, `gating suite failed on the edited copy:\n${failures}\n…\n${output.slice(-4000)}`);
  assert.match(output, /ℹ pass \d+/);
  assert.equal(feedRequests, 0, "the gating suite fetched the calendar feed");
});

// ---------- …and the edits really are in that build (so the pass above is not vacuous) ----------

await build({ name: "cms-edited-copy", root: copy, env: { ALERT_FILE: "src/_settings/alert.json" } });
const edited = (p) => page(p, "cms-edited-copy");

test("homepage: new headline, hero photo, real pride numbers, new welcome", () => {
  const home = edited("index.html");
  assert.match(text(home.querySelector("h1")), /Welcome to Courtenay, a school where every child belongs\./);
  assert.equal(home.querySelector(".hero__media img, .hero__media picture img").getAttribute("alt"), "Students reading together in the library");
  assert.deepEqual(home.querySelectorAll(".pride__value").map(text), ["412", "K–8", "14:1"]);
  const welcome = home.querySelector('[data-home-section="welcome"]');
  assert.equal(text(welcome.querySelector("h2")), "Hello from our principal");
  assert.equal(home.querySelectorAll("h1").length, 1, "the welcome's pasted H1 is not a second h1");
  assert.ok(welcome.querySelectorAll("a").some((a) => a.getAttribute("href") === "https://www.cps.edu/"));
});

test("news: 13 posts paginate, the photo post has its photo and inline image, story text stays text", () => {
  assert.equal(edited("news/index.html").querySelectorAll("main .news-card").length, 12);
  assert.equal(edited("news/2/index.html").querySelectorAll("main .news-card").length, 1);
  const card = edited("news/index.html").querySelectorAll("main .news-card")
    .find((c) => c.querySelector(".news-card__link").getAttribute("href") === `${PREFIX}/news/book-fair-thank-you/`);
  assert.ok(card.classList.contains("news-card--photo"));
  const post = edited("news/book-fair-thank-you/index.html");
  assert.equal(text(post.querySelector(".page-header time")), "November 2, 2026", "the Date field wins over the file name");
  assert.ok(post.querySelector('main .post picture img[alt="Students at the fair"]'), "inline image goes through the image pipeline");
  assert.equal(post.querySelectorAll("h1").length, 1);
  assert.match(text(edited("news/math-night/index.html").querySelector("main .post")), /Use \{\{ braces \}\} and \{% raw %\} in a story/);
  assert.match(buildLog("cms-edited-copy"), /\[images\].*old-photo-story.*deleted-photo\.jpg/);
});

test("staff: the new email and the new teacher's photo show", () => {
  const staff = edited("staff/index.html");
  assert.ok(staff.querySelector('a[href="mailto:kmendez@cps.edu"]'));
  const card = staff.querySelectorAll(".staff-card").find((c) => /Ms\. New Teacher/.test(c.text));
  assert.equal(card.querySelector("img").getAttribute("alt"), "Ms. New Teacher smiling");
});

test("pages: the dropdowns follow the edits; pasted H1/H4 headings are demoted", () => {
  const nav = edited("index.html").querySelector("header nav");
  const about = nav.querySelectorAll("#subnav-about a").map(text);
  assert.ok(about.includes("Our history") && about.includes("Visit us") && !about.includes("Tours"));
  assert.ok(!nav.querySelectorAll("#subnav-families a").map(text).includes("Athletics"));
  const enroll = edited("enroll/index.html");
  assert.equal(enroll.querySelectorAll("h1").length, 1);
  assert.deepEqual(enroll.querySelectorAll("main .page-body h2, main .page-body h3, main .page-body h4").map((h) => h.tagName), ["H2", "H3"]);
  assert.ok(edited("about/principal/index.html").querySelector("main .page-portrait .ph"), "portrait comes from the layout");
  assert.ok(edited("about/principal/index.html").querySelector("main .page-body picture img"));
});

test("school details and alert: new hours shown, unsafe alert link dropped with a warning", () => {
  assert.match(text(edited("index.html").querySelector("footer")), /7:45 am – 3:45 pm/);
  assert.match(buildLog("cms-edited-copy"), /\[links\].*news\//);
});
