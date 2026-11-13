// Quality pass (Task 14): spacing and type come from the DESIGN.md tokens, and the hero words
// always sit on the navy-deep overlay.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (f) => readFileSync(new URL(`../../src/css/${f}`, import.meta.url), "utf8");
const sheets = { "components.css": read("components.css"), "pages.css": read("pages.css") };
const rule = (css, selector) => {
  const at = css.indexOf(`${selector} {`);
  return at < 0 ? null : css.slice(at, css.indexOf("}", at));
};

test("gaps use the spacing scale (DESIGN.md 7), never em or one-off px", () => {
  const bad = [];
  for (const [file, css] of Object.entries(sheets)) {
    for (const [, value] of css.matchAll(/(?<![-\w])gap:\s*([^;]+);/g)) {
      // 1px is the quick-task divider hairline (the grid's ground shows through), not spacing.
      const ok = value.split(/\s+/).every((v) => /^var\(--space-[1-9]\)$/.test(v) || v === "1px" || v === "0");
      if (!ok) bad.push(`${file}: gap: ${value}`);
    }
  }
  assert.deepEqual(bad, []);
});

test("buttons, the hero line and staff names use type tokens, not one-off sizes (DESIGN.md 6)", () => {
  const pages = sheets["pages.css"];
  assert.doesNotMatch(rule(pages, "  .home-actions .btn") ?? "", /font-size/);
  assert.doesNotMatch(pages, /\.hero__sub \{ font-size: \d+px/);
  assert.doesNotMatch(rule(pages, ".staff-card__name") ?? "", /font-size/);
});

test("the hero words sit on a navy-deep layer anchored to them (DESIGN.md 9, A2)", () => {
  const before = rule(sheets["pages.css"], ".hero__content::before");
  assert.ok(before, ".hero__content::before exists");
  assert.match(before, /color-mix\(in srgb, var\(--color-surface-brand-strong\) 90%, transparent\)/);
  assert.match(before, /z-index: -1/);
});

test("hover moves nothing but the card photo zoom and the nav underline (DESIGN.md 12)", () => {
  const allowed = [".news-card:hover .news-card__media img", ".site-nav__link:hover::after"];
  const moved = [];
  for (const [file, css] of Object.entries(sheets)) {
    for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!selector.includes(":hover") || !/transform:\s*(?!none)/.test(body)) continue;
      const hovered = selector.split(",").map((s) => s.trim()).filter((s) => s.includes(":hover"));
      for (const s of hovered) if (!allowed.includes(s)) moved.push(`${file}: ${s}`);
    }
  }
  assert.deepEqual(moved, []);
});
