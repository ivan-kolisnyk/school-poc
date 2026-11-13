import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { existsSync, readdirSync } from "node:fs";

const BASE = "/school-poc";
if (!existsSync("_site/news")) {
  throw new Error("_site/news not found: build the site first (npm run build:ci), then run npm run test:a11y.");
}
const post = readdirSync("_site/news", { withFileTypes: true }).find((d) => d.isDirectory() && d.name !== "page")?.name;
if (!post) throw new Error("_site/news has no post folders: the a11y suite needs at least one news post.");
const pages = [
  "/", "/news/", `/news/${post}/`, "/events/", "/about/", "/families/preschool/",
  "/enroll/", "/staff/", "/contact/", "/search/", "/404.html",
];
const widths = [320, 390, 768, 1024, 1440];
const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

/** Wait for finite animations (the hero entrance) to end, so checks see the resting page. */
const settle = (page) =>
  page.evaluate(() => Promise.all(document.getAnimations()
    .filter((a) => a.effect && a.effect.getComputedTiming().endTime !== Infinity)
    .map((a) => a.finished.catch(() => {}))));

for (const p of pages) {
  test.describe(p, () => {
    test("no axe violations", async ({ page }) => {
      await page.goto(BASE + p);
      await settle(page);
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

    // A7: "Skip to main content" is the first Tab stop and moves focus to main.
    test("first Tab focuses the skip link, which moves focus to main", async ({ page }) => {
      await page.goto(BASE + p);
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const a = document.activeElement;
        return { tag: a.tagName, href: a.getAttribute("href"), skip: a.classList.contains("skip-link") };
      });
      expect(focused).toEqual({ tag: "A", href: "#main", skip: true });
      await page.keyboard.press("Enter");
      await expect(page.locator("main#main")).toBeFocused();
    });

    // A4: ≥ 44×44, and ≥ 48 tall for buttons, nav rows and quick-task tiles. Links inside
    // running text are exempt (WCAG 2.5.8 inline exception): inline links in .prose paragraphs
    // and list items, and inline links inside a sentence of other text. Everything else is
    // measured, including standalone links, document links and link rows inside .prose.
    test("tap targets are at least 44x44 at 390", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 900 });
      await page.goto(BASE + p);
      await settle(page);
      const small = await page.evaluate(() => {
        const TALL = ".btn, .header-btn, .site-nav__link, .site-nav__sub a, .quick-tasks--tiles .quick-task, "
          + ".quick-tasks--menu .quick-task, .staff-filter__btn, button[type='submit']";
        const ownText = (el) => (el.textContent || "").replace(/\s+/g, "");
        const inRunningText = (el) => {
          if (el.tagName !== "A" || getComputedStyle(el).display !== "inline") return false;
          if (el.closest(".prose p, .prose li")) return true;
          const block = el.closest("p, li, dd");
          return Boolean(block) && ownText(block).length > ownText(el).length;
        };
        // A stretched link (whole-card link through an absolutely positioned ::after) is hit
        // anywhere on its card: confirm by hit-testing the card's corners, then use the card's box.
        const hitBox = (el) => {
          const r = el.getBoundingClientRect();
          const card = el.offsetParent;
          if (!card || getComputedStyle(el, "::after").position !== "absolute") return r;
          card.scrollIntoView({ block: "center" });
          const c = card.getBoundingClientRect();
          const pts = [[c.left + 2, c.top + 2], [c.right - 2, c.top + 2], [c.left + 2, c.bottom - 2], [c.right - 2, c.bottom - 2]];
          const covers = pts.every(([x, y]) => {
            const hit = document.elementFromPoint(x, y);
            return hit && (hit === el || el.contains(hit));
          });
          return covers ? c : el.getBoundingClientRect();
        };
        return [...document.querySelectorAll("a[href], button, input:not([type='hidden']), select, textarea")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden" && !inRunningText(el);
          })
          .map((el) => {
            const r = hitBox(el);
            const minH = el.matches(TALL) ? 48 : 44;
            return { el, r, minH, bad: r.width < 44 || r.height < minH };
          })
          .filter((x) => x.bad)
          .map(({ el, r, minH }) => `${el.tagName.toLowerCase()}.${el.className} "${(el.textContent || "").trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)} (min 44x${minH})`);
      });
      expect(small).toEqual([]);
    });
  });
}

// A6 (WCAG 2.4.11): Tab through a long page; every focused element sits fully below the
// sticky header and inside the viewport.
for (const w of [390, 1440]) {
  test(`A6: focus is never hidden behind the sticky header at ${w}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 800 });
    await page.goto(`${BASE}/`);
    await settle(page);
    const problems = [];
    let seen = 0;
    for (let i = 0; i < 120; i++) {
      await page.keyboard.press("Tab");
      const state = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return { done: true };
        const header = document.querySelector("[data-header]");
        const inHeader = header.contains(el) || el.classList.contains("skip-link");
        const r = el.getBoundingClientRect();
        const top = header.getBoundingClientRect().bottom;
        return {
          done: false, inHeader,
          label: `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}"`,
          ok: r.top >= top - 0.5 && r.bottom <= window.innerHeight + 0.5,
          box: `top ${Math.round(r.top)} bottom ${Math.round(r.bottom)} header ${Math.round(top)}`,
          last: [...document.querySelectorAll("footer a[href], footer button")].pop() === el,
        };
      });
      if (state.done) break;
      if (state.inHeader) continue;
      seen++;
      if (!state.ok) problems.push(`${state.label}: ${state.box}`);
      if (state.last) break;
    }
    expect(seen).toBeGreaterThan(20);
    expect(problems).toEqual([]);
  });
}

// A16: with reduced motion nothing animates and nothing stays hidden. base.css cuts every
// duration to .01ms under reduced motion, so only animations longer than 1ms count as motion.
test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__moving = () => document.getAnimations()
        .filter((a) => a.playState === "running" && a.effect && a.effect.getComputedTiming().activeDuration > 1)
        .map((a) => `${a.animationName || a.transitionProperty} on ${a.effect.target?.className}`);
    });
  });

  test("A16: homepage loads at rest with the hero visible", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const state = await page.evaluate(() => ({
      moving: window.__moving(),
      hero: [...document.querySelectorAll(".hero-enter")].map((el) => {
        const s = getComputedStyle(el);
        return `${s.opacity} ${s.transform}`;
      }),
    }));
    expect(state.moving).toEqual([]);
    expect(state.hero.length).toBeGreaterThan(0);
    for (const h of state.hero) expect(h).toBe("1 none");
  });

  test("A16: the mobile menu opens without motion and is fully shown", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`${BASE}/`);
    await page.locator("[data-menu-toggle]").click();
    const state = await page.evaluate(() => {
      const s = getComputedStyle(document.querySelector("[data-menu]"));
      return { moving: window.__moving(), display: s.display, opacity: s.opacity, transform: s.transform };
    });
    expect(state).toEqual({ moving: [], display: "block", opacity: "1", transform: "none" });
  });

  test("A16: hovering a news card does not zoom its photo", async ({ page }) => {
    await page.goto(`${BASE}/news/`);
    const card = page.locator(".news-card").first();
    await card.hover();
    expect(await page.evaluate(() => window.__moving())).toEqual([]);
    const img = card.locator(".news-card__media img");
    if (await img.count()) expect(await img.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
  });
});

test("staff group filter shows only the chosen group and announces the count", async ({ page }) => {
  await page.goto(`${BASE}/staff/`);
  const bar = page.locator("[data-staff-filter]");
  await expect(bar).toBeVisible();
  const status = page.locator("[data-staff-status]");
  await expect(status).toHaveAttribute("aria-live", "polite");
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
  const shown = await page.locator(`[data-staff-group="${name}"] .staff-card`).count();
  await expect(status).toContainText(String(shown));
  await expect(status).toContainText(name);
  await bar.locator("button[data-group='']").click();
  await expect(bar.locator("button[data-group='']")).toHaveAttribute("aria-pressed", "true");
  await expect(first).toHaveAttribute("aria-pressed", "false");
  const groups = page.locator("[data-staff-group]");
  for (let i = 0; i < await groups.count(); i++) await expect(groups.nth(i)).toBeVisible();
  await expect(status).toContainText(String(await page.locator(".staff-card").count()));
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
