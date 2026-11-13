// Reads the site's editable content (what Pages CMS writes) so build tests can derive what the
// pages must show from the content itself, instead of snapshotting today's text. The deploy-gating
// suite (tests/unit + tests/build) must pass whatever editors save; see tests/regression/.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const src = path.join(root, "src");

/** { data, body } of a Markdown file with YAML front matter. Dates stay the strings editors typed. */
export function readFrontMatter(file) {
  const abs = path.isAbsolute(file) ? file : path.join(root, file);
  const raw = readFileSync(abs, "utf8").replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const m = raw.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
  if (!m) throw new Error(`${path.relative(root, abs)}: no YAML front matter (--- … ---) at the top of the file`);
  const data = parseYaml(m[1]) ?? {};
  if (typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`${path.relative(root, abs)}: front matter is not a list of fields`);
  }
  return { data, body: m[2] };
}

export const json = (rel) => JSON.parse(readFileSync(path.join(root, rel), "utf8"));
export const siteData = () => json("src/_data/site.json");
export const strings = () => json("src/_settings/strings.en.json");
export const navData = () => json("src/_data/nav.json");
export const home = () => readFrontMatter("src/index.md");

const mdFiles = (dir) => readdirSync(path.join(root, dir)).filter((f) => f.endsWith(".md")).sort();

/** News posts as Pages CMS saves them; the URL slug is the file name without its date prefix. */
export function newsPosts(dir = "src/news") {
  return mdFiles(dir).map((file) => {
    const { data, body } = readFrontMatter(path.join(dir, file));
    return { file, slug: file.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, ""), data, body };
  });
}

/** People in the staff directory (one file per person per group). */
export function staffPeople(dir = "src/staff/people") {
  return mdFiles(dir).map((file) => ({ file, data: readFrontMatter(path.join(dir, file)).data }));
}

const blank = (v) => !String(v ?? "").trim();

/** An image field value resolves to a file: site-root paths live under src/, web addresses pass. */
export function imageFileExists(value) {
  const s = String(value ?? "").trim();
  if (/^(https?:)?\/\//i.test(s) || s.startsWith("data:")) return true;
  let clean = s.split(/[?#]/)[0];
  try {
    clean = decodeURI(clean);
  } catch {
    return false;
  }
  return clean.startsWith("/") && existsSync(path.join(src, clean));
}

/** The rule every photo field follows: shown only with alt text and an existing file. */
export const showsPhoto = (image, alt) => !blank(image) && !blank(alt) && imageFileExists(image);

/** The built page for a site URL ("/about/tours/" -> "about/tours/index.html"). */
export const pageFile = (url) => (url.replace(/^\//, "") + (url.endsWith("/") ? "index.html" : "")).replace(/^$/, "index.html");

// ---------- Section pages (the header dropdowns and hub link rows) ----------

function walkTemplates(dir = src, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkTemplates(p, acc);
    else if (/\.(md|njk)$/.test(entry.name)) acc.push(p);
  }
  return acc;
}

/** Directory data (`about/about.json`) merged with the file's own front matter. */
function templateData(file) {
  const dir = path.dirname(file);
  const dirJson = path.join(dir, `${path.basename(dir)}.json`);
  const dirData = existsSync(dirJson) ? JSON.parse(readFileSync(dirJson, "utf8")) : {};
  return { ...dirData, ...readFrontMatter(file).data };
}

/** The URL a page file builds to, or false (menu-only entries). Only plain page files are expected here. */
function pageUrl(file, data) {
  if (data.permalink === false) return false;
  if (typeof data.permalink === "string") return data.permalink;
  const rel = path.relative(src, file).replace(/\.(md|njk)$/, "").split(path.sep).join("/");
  return rel === "index" ? "/" : rel.endsWith("/index") ? `/${rel.slice(0, -"index".length)}` : `/${rel}/`;
}

/** Every content page and menu entry editors manage: { file, data, url }. */
export function sitePages() {
  return walkTemplates()
    .map((file) => {
      const data = templateData(file);
      return { file: path.relative(root, file), data, url: pageUrl(file, data) };
    });
}

/** What a section's dropdown must list: the pages with that `section`, hub excluded, by order then title. */
export function sectionEntries(key) {
  const hub = navData().find((n) => n.key === key)?.url;
  return sitePages()
    .filter((p) => p.data.section === key && p.url !== hub && p.data.eleventyExcludeFromCollections !== true)
    .sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999) || String(a.data.title).localeCompare(String(b.data.title)));
}

/** Built content pages (layout page.njk) that editors manage, as output paths. */
export function contentPageFiles() {
  return sitePages()
    .filter((p) => p.url && p.data.layout === "layouts/page.njk")
    .map((p) => pageFile(p.url));
}
