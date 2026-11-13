import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
import { formatDate, formatTime } from "./lib/dates.js";
import { isAlertActive } from "./lib/alert.js";
import { chicagoLocalToDate } from "./lib/dates.js";
import { icon, placeholder, headingClass } from "./lib/shortcodes.js";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

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

  eleventyConfig.addShortcode("icon", icon);
  eleventyConfig.addShortcode("placeholder", placeholder);
  // Kept until Task 6 replaces the homepage calendar list.
  eleventyConfig.addFilter("dateDisplay", (d) => formatDate(d, "post"));

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
