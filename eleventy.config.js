import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import { formatDate, formatTime, chicagoLocalToDate } from "./lib/dates.js";
import { isAlertActive } from "./lib/alert.js";
import { normalizeHeadings, safeHref, imageRefs } from "./lib/content.js";
import { icon, placeholder, headingClass, linkPhrase, externalKind, externalIcon, docLink, callout } from "./lib/shortcodes.js";
import loadStrings from "./src/_data/strings.js";
import { eventWhen, eventsWithin, groupByMonth, chicagoDay } from "./lib/events.js";
import { staffGroups, initials, staffPhotoIssue } from "./lib/staff.js";
import { nextHeadlines, newsDay, hasPhoto, photoIssue } from "./lib/news.js";
import { heroPhotoIssue } from "./lib/home.js";
import { homeMenuDays, menuWeeks } from "./lib/menus.js";

export default function (eleventyConfig) {
  const inputDir = "src";

  /**
   * Does an image path from content point at a file? Site-root paths ("/images/x.jpg") live
   * under src/, relative ones next to the page; web addresses are trusted. A file name the
   * browser could not decode (a bare "%") counts as missing.
   */
  const imageExists = (src, data) => {
    const value = String(src ?? "").trim();
    if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:")) return true;
    let clean;
    try {
      clean = decodeURI(value.split(/[?#]/)[0]);
    } catch {
      return false;
    }
    if (!clean) return false;
    const base = clean.startsWith("/") ? inputDir : path.dirname(data?.page?.inputPath ?? path.join(inputDir, "x"));
    return existsSync(path.join(base, clean));
  };

  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  // Every <img> in the output becomes AVIF + WebP + original at these widths (DESIGN.md 9).
  // Templates always set `sizes`; logos opt out with `eleventy:ignore`.
  // An image that cannot be processed never fails the build (a crashed build blocks every
  // publish): the preprocessor below already drops images whose file is missing, with a warning.
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["avif", "webp", "auto"],
    widths: [400, 800, 1200],
    failOnError: false,
    htmlOptions: { imgAttributes: { loading: "lazy", decoding: "async" } },
  });

  // Images an editor put in a rich-text body (Markdown or HTML) whose file is missing, e.g.
  // deleted from the media library later: leave the image out and warn, naming the page.
  eleventyConfig.addPreprocessor("missing-images", "md,html", (data, content) => {
    let out = content;
    for (const { match, src } of imageRefs(content)) {
      if (imageExists(src, data)) continue;
      console.warn(`[images] ${data.page.inputPath}: image file not found: ${src}; the image is left out.`);
      out = out.replace(match, "");
    }
    return out;
  });

  // Rich-text bodies: editor headings re-levelled under the template's heading (lib/content.js).
  eleventyConfig.addFilter("bodyHeadings", (html, parentLevel = 1) => normalizeHeadings(html, parentLevel));
  // CMS link fields (alert link, welcome link): only safe links survive; others warn and drop.
  const linkWarned = new Set();
  eleventyConfig.addFilter("safeHref", function (href, field = "link") {
    const safe = safeHref(href);
    const key = `${field}|${href}`;
    if (!safe && String(href ?? "").trim() && !linkWarned.has(key)) {
      linkWarned.add(key);
      console.warn(`[links] ${this.page?.inputPath ?? "?"}: ${field} "${String(href).trim()}" is not a full web address or a site path starting with "/"; the link is left out.`);
    }
    return safe;
  });

  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  // Only the weights DESIGN.md section 6 allows.
  eleventyConfig.addPassthroughCopy({
    "node_modules/@fontsource/oswald/files/oswald-latin-{500,700}-normal.woff2": "fonts",
    "node_modules/@fontsource/barlow/files/barlow-latin-{400,500,600}-normal.woff2": "fonts",
  });
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });

  // Interface text lives in src/_settings and is loaded by src/_data/strings.js.
  eleventyConfig.ignores.add("src/_settings/**");

  eleventyConfig.addFilter("dateFormat", (value, style) => formatDate(value, style));
  eleventyConfig.addFilter("timeFormat", (value) => formatTime(value));
  eleventyConfig.addFilter("headingClass", headingClass);
  eleventyConfig.addFilter("initials", initials);

  // Staff directory (DESIGN.md 10.11): non-empty groups in the fixed order of strings.staff.groups.
  // A photo needs alt text and an existing file; otherwise the initials circle shows (never a build failure).
  eleventyConfig.addCollection("staffGroups", (api) => {
    const items = api.getFilteredByTag("staff");
    for (const item of items) {
      const issue = staffPhotoIssue(item.data, (src, data) => imageExists(src, data));
      if (issue) console.warn(`[staff] ${item.inputPath}: ${issue}; showing the initials circle.`);
    }
    return staffGroups(items, loadStrings().staff.groups);
  });
  eleventyConfig.addFilter("staffPhoto", (data) => Boolean(String(data?.photo ?? "").trim()) && staffPhotoIssue(data, (src, d) => imageExists(src, d)) === null);
  // Test-only hook: add the fixture people in STAFF_FIXTURES_DIR as if they were in src/staff/people/.
  if (process.env.STAFF_FIXTURES_DIR) {
    const dir = path.resolve(process.env.STAFF_FIXTURES_DIR);
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      eleventyConfig.addTemplate(`staff/people/${file}`, readFileSync(path.join(dir, file), "utf8"));
    }
  }

  eleventyConfig.addFilter("alertActive", (alert, now) => isAlertActive(alert, now));
  eleventyConfig.addFilter("chicagoIso", (local) => chicagoLocalToDate(String(local ?? "").trim()).toISOString());

  // News (DESIGN.md 10.8). Posts are tagged "news" by src/news/news.json.
  // A photo needs alt text and an existing file; otherwise the post falls back to text-only
  // (a photo deleted in the CMS must never fail the build — the image plugin would).
  const warned = new Set();
  eleventyConfig.addCollection("newsDesc", (api) => {
    // Test-only hook: NEWS_EMPTY=1 builds the site as if no posts existed (empty states).
    if (process.env.NEWS_EMPTY === "1") return [];
    const posts = api.getFilteredByTag("news").slice().reverse();
    for (const post of posts) {
      const issue = photoIssue(post.data, imageExists);
      if (issue && !warned.has(post.inputPath)) {
        warned.add(post.inputPath);
        console.warn(`[news] ${post.inputPath}: ${issue}; showing the text-only card.`);
      }
    }
    return posts;
  });
  eleventyConfig.addFilter("nextHeadlines", nextHeadlines);
  eleventyConfig.addFilter("newsDay", newsDay);
  eleventyConfig.addFilter("hasPhoto", (data) => hasPhoto(data, imageExists));

  // Test-only hook: add the fixture posts in NEWS_FIXTURES_DIR as if they were in src/news/.
  if (process.env.NEWS_FIXTURES_DIR) {
    const dir = path.resolve(process.env.NEWS_FIXTURES_DIR);
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      eleventyConfig.addTemplate(`news/${file}`, readFileSync(path.join(dir, file), "utf8"));
    }
  }

  // Homepage hero photo (DESIGN.md 10.3): shown only with alt text and an existing file;
  // otherwise the placeholder shows and the build warns once.
  const heroWarned = new Set();
  eleventyConfig.addFilter("heroPhoto", function (data) {
    const inputPath = this.page?.inputPath ?? "src/index.md";
    const issue = heroPhotoIssue(data, (src) => imageExists(src, { page: { inputPath } }));
    if (issue && !heroWarned.has(inputPath)) {
      heroWarned.add(inputPath);
      console.warn(`[home] ${inputPath}: ${issue}; showing the placeholder.`);
    }
    return Boolean(String(data?.hero_image ?? "").trim()) && issue === null;
  });
  // Test-only hook: build the homepage from HOME_FIXTURE instead of src/index.md.
  if (process.env.HOME_FIXTURE) {
    eleventyConfig.ignores.add("src/index.md");
    eleventyConfig.addTemplate("index.md", readFileSync(path.resolve(process.env.HOME_FIXTURE), "utf8"));
  }

  // Test-only hook: add the fixture content pages in PAGES_FIXTURES_DIR (each sets its own permalink).
  if (process.env.PAGES_FIXTURES_DIR) {
    const dir = path.resolve(process.env.PAGES_FIXTURES_DIR);
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      eleventyConfig.addTemplate(`fixture-pages/${file}`, readFileSync(path.join(dir, file), "utf8"));
    }
  }

  eleventyConfig.addShortcode("icon", icon);
  eleventyConfig.addShortcode("placeholder", placeholder);
  eleventyConfig.addFilter("linkPhrase", linkPhrase);

  // ---------- Inner pages (DESIGN.md 10.2, 10.4, 10.10) ----------
  // Pages say which section they belong to (`section`) and where they sit in its menu (`order`).
  // A section's hub is its nav.json URL; every other page with that section is a child. Menu-only
  // entries (`permalink: false`) link elsewhere through `external_url` (another site) or
  // `menu_url` (a page built elsewhere, e.g. /staff/).
  const nav = JSON.parse(readFileSync(path.join(inputDir, "_data/nav.json"), "utf8"));
  for (const { key, url } of nav) {
    eleventyConfig.addCollection(`section_${key}`, (api) =>
      api.getAll()
        .filter((item) => item.data.section === key && item.url !== url)
        .sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999) || a.data.title.localeCompare(b.data.title))
    );
  }
  eleventyConfig.addFilter("entryUrl", (item) => item.data.external_url || item.data.menu_url || item.url);

  // External links show the "opens CPS site" / "opens another site" icon, in templates and in
  // Markdown bodies alike. Links open in the same tab (DESIGN.md 10.2).
  const strings = loadStrings();
  const externalLabels = { cps: strings.a11y.externalCps, other: strings.a11y.external };
  eleventyConfig.addFilter("externalKind", externalKind);
  eleventyConfig.addFilter("externalIcon", (href) => externalIcon(externalLabels, href));
  let md;
  eleventyConfig.amendLibrary("md", (lib) => {
    md = lib;
    const render = (tokens, idx, options, env, self) => self.renderToken(tokens, idx, options);
    const open = lib.renderer.rules.link_open || render;
    const close = lib.renderer.rules.link_close || render;
    const stack = []; // rendering is synchronous, so open/close pairs nest on one stack
    lib.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      stack.push(externalIcon(externalLabels, tokens[idx].attrGet("href")));
      return open(tokens, idx, options, env, self);
    };
    lib.renderer.rules.link_close = (tokens, idx, options, env, self) => {
      const ext = stack.pop();
      return ext + close(tokens, idx, options, env, self);
    };
  });
  // {% doc "LSC minutes, Oct 2026", "/files/minutes.pdf", "PDF", "220 KB" %}
  eleventyConfig.addShortcode("doc", (label, url, type, size) => docLink(externalLabels, label, url, type, size));
  // {% callout %}Markdown…{% endcallout %} or {% callout "Deadline" %}…{% endcallout %}
  eleventyConfig.addPairedShortcode("callout", (content, title) => callout(md.render(String(content).trim()), title));

  // Events from Google Calendar (DESIGN.md 10.9); data in src/_data/events.js.
  eleventyConfig.addFilter("eventWhen", eventWhen);
  eleventyConfig.addFilter("eventMonths", groupByMonth);
  eleventyConfig.addFilter("eventsWithin", eventsWithin);
  eleventyConfig.addFilter("chicagoDay", chicagoDay);

  // School meal menus from CPS's MealViewer (lib/menus.js); data in src/_data/menus.js.
  eleventyConfig.addFilter("homeMenuDays", homeMenuDays);
  eleventyConfig.addFilter("menuWeeks", menuWeeks);

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
