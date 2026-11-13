import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import { formatDate, formatTime } from "./lib/dates.js";
import { isAlertActive } from "./lib/alert.js";
import { chicagoLocalToDate } from "./lib/dates.js";
import { icon, placeholder, headingClass, linkPhrase } from "./lib/shortcodes.js";
import { eventWhen, eventsWithin, groupByMonth, chicagoDay } from "./lib/events.js";
import { nextHeadlines, newsDay, hasPhoto, photoIssue } from "./lib/news.js";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  // Every <img> in the output becomes AVIF + WebP + original at these widths (DESIGN.md 9).
  // Templates always set `sizes`; logos opt out with `eleventy:ignore`.
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["avif", "webp", "auto"],
    widths: [400, 800, 1200],
    htmlOptions: { imgAttributes: { loading: "lazy", decoding: "async" } },
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

  eleventyConfig.addFilter("alertActive", (alert, now) => isAlertActive(alert, now));
  eleventyConfig.addFilter("chicagoIso", (local) => chicagoLocalToDate(local).toISOString());

  // News (DESIGN.md 10.8). Posts are tagged "news" by src/news/news.json.
  // A photo needs alt text and an existing file; otherwise the post falls back to text-only
  // (a photo deleted in the CMS must never fail the build — the image plugin would).
  const inputDir = "src";
  const imageExists = (src, data) => {
    if (/^(https?:)?\/\//i.test(src) || src.startsWith("data:")) return true;
    const clean = decodeURI(src.split(/[?#]/)[0]);
    const base = clean.startsWith("/") ? inputDir : path.dirname(data?.page?.inputPath ?? path.join(inputDir, "x"));
    return existsSync(path.join(base, clean));
  };
  const warned = new Set();
  eleventyConfig.addCollection("newsDesc", (api) => {
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

  eleventyConfig.addShortcode("icon", icon);
  eleventyConfig.addShortcode("placeholder", placeholder);
  eleventyConfig.addFilter("linkPhrase", linkPhrase);

  // Events from Google Calendar (DESIGN.md 10.9); data in src/_data/events.js.
  eleventyConfig.addFilter("eventWhen", eventWhen);
  eleventyConfig.addFilter("eventMonths", groupByMonth);
  eleventyConfig.addFilter("eventsWithin", eventsWithin);
  eleventyConfig.addFilter("chicagoDay", chicagoDay);

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
