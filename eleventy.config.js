import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
import { formatDate, formatTime } from "./lib/dates.js";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });

  // Interface text lives in src/_settings and is loaded by src/_data/strings.js.
  eleventyConfig.ignores.add("src/_settings/**");

  eleventyConfig.addFilter("dateFormat", (value, style) => formatDate(value, style));
  eleventyConfig.addFilter("timeFormat", (value) => formatTime(value));
  // Kept until Task 6 replaces the homepage calendar list.
  eleventyConfig.addFilter("dateDisplay", (d) => formatDate(d, "post"));

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
