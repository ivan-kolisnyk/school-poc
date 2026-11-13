import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readdirSync } from "node:fs";

const BASE = "/school-poc";
const post = readdirSync("_site/news", { withFileTypes: true }).find((d) => d.isDirectory())?.name;
const pages = [
  "/", "/news/", `/news/${post}/`, "/events/", "/about/", "/families/preschool/",
  "/enroll/", "/staff/", "/contact/", "/search/", "/404.html",
];
const widths = [320, 390, 768, 1024, 1440];
const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

for (const p of pages) {
  test.describe(p, () => {
    test("no axe violations", async ({ page }) => {
      await page.goto(BASE + p);
      const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    });

    for (const w of widths) {
      test(`no horizontal scroll at ${w}`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: 900 });
        await page.goto(BASE + p);
        const { scrollWidth, innerWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth,
        }));
        expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
      });
    }

    test("first Tab focuses the skip link", async ({ page }) => {
      await page.goto(BASE + p);
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const a = document.activeElement;
        return { tag: a.tagName, href: a.getAttribute("href"), cls: a.className };
      });
      expect(focused.tag).toBe("A");
      expect(`${focused.cls} ${focused.href}`).toMatch(/skip|#main/i);
    });

    test("tap targets are at least 44x44 at 390", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 900 });
      await page.goto(BASE + p);
      const small = await page.evaluate(() =>
        [...document.querySelectorAll("a, button, input")]
          .filter((el) => !el.closest(".prose"))
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ el, r }) => r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"
            && !el.classList.contains("skip-link") && el.type !== "hidden" && (r.width < 44 || r.height < 44))
          .map(({ el, r }) => `${el.tagName.toLowerCase()}.${el.className} "${(el.textContent || "").trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`));
      expect(small).toEqual([]);
    });
  });
}

test("staff group filter shows only the chosen group", async ({ page }) => {
  await page.goto(`${BASE}/staff/`);
  const bar = page.locator("[data-staff-filter]");
  await expect(bar).toBeVisible();
  const buttons = bar.locator("button[data-group]:not([data-group=''])");
  expect(await buttons.count()).toBeGreaterThan(1);
  const first = buttons.first();
  const name = await first.getAttribute("data-group");
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(bar.locator("button[data-group='']")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(`[data-staff-group="${name}"]`)).toBeVisible();
  const others = page.locator(`[data-staff-group]:not([data-staff-group="${name}"])`);
  for (let i = 0; i < await others.count(); i++) await expect(others.nth(i)).toBeHidden();
  await bar.locator("button[data-group='']").click();
  await expect(bar.locator("button[data-group='']")).toHaveAttribute("aria-pressed", "true");
  await expect(first).toHaveAttribute("aria-pressed", "false");
  const groups = page.locator("[data-staff-group]");
  for (let i = 0; i < await groups.count(); i++) await expect(groups.nth(i)).toBeVisible();
});

test("mobile menu: Escape closes it and returns focus to the Menu button", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${BASE}/`);
  const button = page.locator("[data-menu-toggle]");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();
});
