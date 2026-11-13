// DESIGN.md 10.0 / 14: layouts survive ~25% longer (Spanish) labels at 320px. Runs against the
// build made with STRINGS_FILE=tests/fixtures/strings-es-sample.json (npm run test:a11y:es).
import { test, expect } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const BASE = "/school-poc";
const SITE = process.env.SITE_DIR || "_site_es";
if (!existsSync(`${SITE}/news`)) {
  throw new Error(`${SITE}/news not found: run npm run test:a11y:es (it builds the Spanish sample first).`);
}
const es = JSON.parse(readFileSync("tests/fixtures/strings-es-sample.json", "utf8"));
const post = readdirSync(`${SITE}/news`, { withFileTypes: true }).find((d) => d.isDirectory() && d.name !== "page")?.name;
const pages = [
  "/", "/news/", `/news/${post}/`, "/events/", "/about/", "/families/preschool/",
  "/enroll/", "/staff/", "/contact/", "/search/", "/404.html",
];
const widths = [320, 390, 768, 1024, 1440];

/**
 * Labels that do not fit their own box (buttons, nav rows, tiles, links styled as controls):
 * the text's bounding box must sit inside the control's content box. Word breaking is switched
 * off first, so a label that only fits by splitting a word ("CONTÁCTENO-S") counts as not
 * fitting (DESIGN.md 10.0: never break mid-word on mobile).
 */
const spills = () => {
  const style = document.createElement("style");
  style.textContent = "* { overflow-wrap: normal !important; word-break: normal !important; hyphens: none !important; }";
  document.head.append(style);
  const out = [...document.querySelectorAll(".btn, .header-btn, .site-nav__link, .site-nav__sub a, .quick-task, "
    + ".staff-filter__btn, .breadcrumb a, .text-link, .site-search__submit, .search-form__submit, .alert__label")]
    .filter((el) => el.getClientRects().length)
    .map((el) => {
      const s = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      const left = box.left + parseFloat(s.borderLeftWidth) + parseFloat(s.paddingLeft);
      const right = box.right - parseFloat(s.borderRightWidth) - parseFloat(s.paddingRight);
      // Visible text only: screen-reader-only text is clipped to 1px and never shows.
      const text = { left: Infinity, right: -Infinity, width: 0 };
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        if (!n.textContent.trim() || n.parentElement.closest(".visually-hidden")) continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) {
          text.left = Math.min(text.left, r.left);
          text.right = Math.max(text.right, r.right);
          text.width = text.right - text.left;
        }
      }
      // The control itself must also stay inside the list, grid or bar that holds it.
      const holder = el.parentElement.closest("ul, ol, nav, .home-actions__inner, .section-head, .staff-filter, .site-header__bar, .breadcrumb");
      const h = holder ? holder.getBoundingClientRect() : box;
      const bad = (text.width > 0 && (text.left < left - 0.5 || text.right > right + 0.5))
        || el.scrollWidth > el.clientWidth + 1 || box.left < h.left - 0.5 || box.right > h.right + 0.5;
      return bad && `${el.className} "${el.textContent.trim().slice(0, 30)}" text ${Math.round(text.left)}–${Math.round(text.right)} `
        + `box ${Math.round(left)}–${Math.round(right)} holder ${Math.round(h.left)}–${Math.round(h.right)}`;
    })
    .filter(Boolean);
  style.remove();
  return out;
};

test("the build uses the Spanish sample labels", async ({ page }) => {
  await page.goto(`${BASE}/`);
  await expect(page.locator(".home-actions .btn--primary")).toHaveText(es.home.enrollNow);
  await expect(page.locator(".skip-link")).toHaveText(es.a11y.skipToContent);
});

for (const p of pages) {
  test.describe(p, () => {
    for (const w of widths) {
      test(`no horizontal scroll or spilling label at ${w}`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: 900 });
        await page.goto(BASE + p);
        const { scrollWidth, innerWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth,
        }));
        expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
        expect(await page.evaluate(spills)).toEqual([]);
      });
    }
  });
}

// The nav and quick-task labels live in the mobile menu below 1024px.
for (const w of [320, 390]) {
  test(`mobile menu fits the longer labels at ${w}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`${BASE}/`);
    await page.locator("[data-menu-toggle]").click();
    const menu = page.locator("[data-menu]");
    await expect(menu).toBeVisible();
    // Open every section so the page lists are measured too.
    for (const t of await page.locator("[data-submenu-toggle]").all()) await t.click();
    const state = await page.evaluate(() => {
      const panel = document.querySelector("[data-menu]");
      return { scroll: panel.scrollWidth, client: panel.clientWidth, doc: document.documentElement.scrollWidth };
    });
    expect(state.scroll).toBeLessThanOrEqual(state.client);
    expect(state.doc).toBeLessThanOrEqual(w);
    expect(await page.evaluate(spills)).toEqual([]);
  });
}
