# Courtenay Site POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Eleventy proof of concept as the Mary E. Courtenay Language Arts Center site described in `DESIGN.md`, with Google Calendar events, per-post news pages, inner pages, a staff directory, search and a full Pages CMS setup.

**Architecture:** Static Eleventy 3 site on GitHub Pages. Small, pure, unit-tested modules in `lib/` (dates, alert window, calendar parsing, news) feed Nunjucks partials styled by token-based CSS. Build-output tests parse the generated HTML. Content is edited in Pages CMS; events come from the school's Google Calendar feed read at build time; a daily scheduled build keeps time-based content current.

**Tech Stack:** Eleventy 3.1, Nunjucks, plain CSS with custom properties, `@11ty/eleventy-img`, `@11ty/eleventy-fetch`, `node-ical`, `lucide-static`, `@fontsource/oswald` + `@fontsource/barlow`, Pagefind, Node's built-in test runner, `node-html-parser`, Playwright + `@axe-core/playwright`, `yaml`.

**Spec:** `DESIGN.md` (visual design) and `docs/superpowers/specs/2026-11-13-site-architecture-design.md` (architecture, content model, POC scope). Executors read both.

## Global Constraints

- Official name: **Mary E. Courtenay Language Arts Center**. Header wordmark: "COURTENAY TIGERS" / "Language Arts Center · Pre-K–8".
- Base colors (DESIGN.md §5.1): navy `#1B2A6B`, navy-deep `#111C4A`, gold `#F6CE1F`, gold-text `#7A6200`, ink `#121733`, muted `#4A5068`, surface `#F4F5F8`, line `#E1E4EC`, white `#FFFFFF`, alert-red `#B42318`. Components use the semantic tokens of §5.2, never raw hex.
- Gold (`#F6CE1F`) must never be text or icon color on white or surface.
- Fonts: Oswald 500/700 (display, H1, H2, labels, buttons, uppercase only when ≤ 8 words); Barlow 400/500/600 (everything else). Self-hosted via Fontsource, `font-display: swap`.
- Type scale, spacing tokens (`space.1`–`space.9` = 4, 8, 12, 16, 24, 32, 48, 64, 96 px), radius (`0` / `4px`), shadow (header only), z-index (0/20/30/50) and motion tokens (150/200/400 ms, `cubic-bezier(.2,.8,.2,1)`) exactly as DESIGN.md §6, §7, §12.
- Container max-width 1200px; gutters 16/24/32px; breakpoints tested at 320, 390, 768, 1024, 1440. No horizontal scroll at 320px.
- Tap targets ≥ 44×44px; buttons, nav rows and quick-task tiles ≥ 48px.
- Navigation: exactly five top-level items — About, Families, Enroll, News & Events, Contact. Staff system links only in the footer.
- Quick tasks: exactly six — Calendar · Lunch menu · Parent portal · Enroll · Before & after care · Contact.
- No carousels, tickers, auto-advancing content, scroll-triggered animation, parallax or count-up numbers. Everything honors `prefers-reduced-motion`.
- No stock photos: labeled striped placeholders until real photos exist. No invented facts: pride values stay `000` / `PRE-K–8` / `00:1`.
- English only. No language switch or "Español" link. All interface text comes from `src/_data/strings.json`.
- Social: Instagram only, `https://www.instagram.com/courtenaytigers/`, accessible name "Courtenay on Instagram".
- Times shown and alert/event windows interpreted in `America/Chicago`. CI runs in UTC.
- The site is deployed under a path prefix (`/school-poc/`); every link, asset, image and search file must work under it.
- Monthly running cost: $0.

## Design skills and subagents

Each task names the agent type to dispatch and the design skills the implementer must load before writing code.

| Skill | Used for | Rule |
|---|---|---|
| **ui-ux-pro-max** | Tasks 2, 3, 8, 14: tokens/contrast, nav and touch rules, homepage composition, pre-delivery checklist; `--domain ux` searches for accessibility, z-index and loading guidance | Its generated palette/fonts are **not** used — DESIGN.md wins |
| **design-taste-frontend** | Tasks 8, 14: hero and section composition, hover micro-interactions, real photography rules, and its checkers (`check.mjs`, `shoot.mjs`, `perf.mjs`, `consistency.mjs`) for layout, overflow, screenshots and weight | Do **not** arm `gate.mjs` (its house rules conflict with this spec and would block finishing). Conflicting checks are recorded in `.taste-skill/waivers.json` with the DESIGN.md section as reason: one-section-per-screen, address/phone formatting, "real full-colour icons" (we use Lucide outline), labeled placeholders, no violet (already satisfied) |
| **design-motion-principles** | Tasks 3, 8, 14: menu open/close, hero entrance, card and button hover/press; audit mode in Task 14 | Durations and easing from DESIGN.md §12 |
| **design-system** (project skill) | Reviewers: check every component against the state contract (DESIGN.md §10.0) | Its extracted Kearney tokens are not used |

Agent types: implementation tasks → `general-purpose` (model `opus` where noted for design-heavy work, `sonnet` for mechanical tasks). Content gathering from courtenay.cps.edu → `web-fetch`. Per-task review → `general-purpose` with superpowers:requesting-code-review. No other agent types apply.

## Progress log: `status.md` (required for every agent)

`status.md` at the repo root is the shared progress log, so any agent that stops (usage limit, crash, timeout) can be replaced by a fresh agent that continues where it left off. Tasks run one at a time, so only one agent writes to it at once.

**Every agent (implementer, web-fetch, reviewer) must:**
1. **On start:** read `status.md`, then `git log --oneline -10` and `git status`. If its task is marked `in progress`, resume from that task's **Next** line — do not restart completed steps. Set the task to `in progress`, add its agent role and start time.
2. **After every plan step** (and before any long-running command): update its task block — tick the step, list files touched, the last command run and its result (PASS/FAIL + one line), and the exact **Next** action. Save the file immediately; it lives in the working tree, so it survives even before a commit.
3. **On blockers:** record them under **Blockers** with what was tried, then stop and report.
4. **On finish:** mark the task `done` with the commit hash, and include `status.md` in the task's commit. Reviewers append `review: approved` or their findings to the same block.
5. **Web-fetch agents** save fetched content to `docs/content-import/<task>-<page>.md` and note the file paths in `status.md`, so fetched pages never need refetching.

The controller (the main session) updates the top **Current** line when dispatching each task and when a review finishes, and on resume reads `status.md` before dispatching anything.

## Review Focus

1. **Path prefix:** on GitHub Pages the site lives under `/school-poc/`. A link, CSS file, font, image, `pagefind/` script or Instagram/CPS link that ignores the prefix breaks only in production. Pinned by Task 1's build tests (built with the prefix) and Task 11/14 checks.
2. **Chicago time vs. UTC builds:** an alert ending "Nov 16, 3:00 pm" or a date-only news date "2026-11-12" must not shift a day or expire hours early when CI builds in UTC. Pinned in Task 1 (`dates`) and Task 4 (`alert`).
3. **Real Google Calendar feeds:** recurring events, cancelled instances (EXDATE / `STATUS:CANCELLED`), all-day events, multi-day events and an unreachable feed. A parent expects the next real events, and the build must not fail. Pinned in Task 6.
4. **Missing or odd content:** zero news posts, a post without a photo, a photo without alt text, a 120-character title, no upcoming events, an alert with no end date. Each must render the designed empty/fallback state, never an empty heading or a broken image. Pinned in Tasks 4, 5, 6, 8.
5. **Small phones:** at 320px nothing overflows horizontally, including long titles and the sample Spanish labels (DESIGN.md §14). Pinned in Task 14's Playwright overflow test.

---

## File structure

```
eleventy.config.js              plugins, filters, shortcodes, collections (modified)
lib/dates.js                    date/time formatting + Chicago time conversion
lib/alert.js                    alert active-window logic
lib/events.js                   ICS → upcoming Event[] (recurrence, exdates, all-day)
lib/news.js                     next-headlines helper
src/_data/site.json             school details, quick-link URLs, calendar URL (modified)
src/_settings/alert.json        alert banner, CMS-edited (new; replaces site.alert)
src/_data/alert.js              loads the alert (ALERT_FILE override for tests)
src/_data/strings.json          all interface text (en)
src/_data/nav.json              five top-level items
src/_data/now.js                build "now" (SITE_NOW env override for tests)
src/_data/events.js             fetch + parse calendar, cache fallback
src/_data/sample-calendar.ics   POC feed (weekly recurring sample events)
src/_includes/layouts/          base.njk, home.njk, page.njk, post.njk
src/_includes/partials/         alert, header, footer, hero, quick-tasks, pride,
                                news-card, events-list, page-header, placeholder
src/css/                        tokens.css, base.css, components.css, pages.css
src/js/site.js                  menu, search toggle, alert expiry, staff filter
src/images/logo.png             current shield (118×128) until vector arrives
src/index.md                    homepage content (modified)
src/news/                       posts (permalinked) + index.njk (paginated list)
src/events/index.njk
src/about/ families/ enroll/ contact/   inner pages (Markdown, section + order)
src/staff/index.njk + src/staff/people/*.md
src/search/index.njk, src/404.md
.pages.yml                      CMS config (modified)
.github/workflows/deploy.yml    tests, schedule, Pagefind, a11y (modified)
tests/unit/*.test.js            node --test
tests/build/*.test.js           build-output tests
tests/helpers/build.js          one-time build + HTML loader
tests/fixtures/calendar.ics     fixed-date fixture
tests/a11y/site.spec.js         Playwright + axe + overflow
```

Retired: `src/_data/calendar.json`, `src/about.md` (moved to `src/about/index.md`), `src/css/style.css`.

---

### Task 1: Test harness, path-prefix-safe base, dates module

**Agent:** `general-purpose`, model `sonnet`.

**Files:**
- Modify: `package.json`, `eleventy.config.js`, `.gitignore`, `src/_data/site.json`, `src/_includes/layouts/base.njk`, `src/_includes/layouts/home.njk`
- Create: `lib/dates.js`, `src/_data/now.js`, `src/_data/strings.json`, `tests/helpers/build.js`, `tests/unit/dates.test.js`, `tests/build/base.test.js`

**Interfaces:**
- Produces:
  - `lib/dates.js`: `formatDate(value: string|Date, style: 'list'|'post'|'card'|'month'|'day'): string`; `formatTime(value: Date): string`; `chicagoLocalToDate(local: string): Date` (parses `"YYYY-MM-DD"` or `"YYYY-MM-DDTHH:mm"` as America/Chicago wall time).
  - Eleventy filters `dateFormat(value, style)` and `timeFormat(value)` wrapping the above.
  - Global data `now` (a `Date`; `process.env.SITE_NOW` overrides).
  - `tests/helpers/build.js`: `build(variant?: { name: string, env: Record<string,string> }): Promise<string>` — memoized per variant name; runs Eleventy into `_test_site/<name>` (default name `default`) with `--pathprefix=/school-poc/` and base env `SITE_NOW=2026-11-13T12:00:00-06:00`, `CALENDAR_ICS_FILE=tests/fixtures/calendar.ics`, merged with `variant.env`; returns the output dir. `page(path: string, variantName = 'default'): HTMLElement` (node-html-parser root of that output). Later tasks use variants for empty/inactive states.
  - `strings.json` top-level keys used by later tasks: `nav`, `quickTasks`, `buttons`, `alertLabels`, `empty`, `footer`, `search`, `a11y`.
- Scripts: `npm test` = `node --test tests/unit tests/build`; `npm run test:a11y` added in Task 14.

- [ ] **Step 1:** Add dev dependencies `node-html-parser` and `yaml`. Add `_test_site/` and `.cache/` to `.gitignore`.
- [ ] **Step 2: Write failing unit tests** `tests/unit/dates.test.js`:
  - `formatDate('2026-11-16','list') === 'Monday, Nov 16'`
  - `formatDate('2026-11-16','post') === 'November 16, 2026'`
  - `formatDate('2026-11-12','card') === 'Nov 12'`; `'month' → 'Nov'`; `'day' → '16'`
  - date-only input does not shift with `TZ=UTC` or `TZ=Pacific/Honolulu` (run the assertion under both via `process.env.TZ` set before import in a child process or by testing a `Date` built from the string)
  - `formatTime(new Date('2026-11-16T14:00:00Z')) === '8:00 am'` (Chicago, CST)
  - `chicagoLocalToDate('2026-11-16T15:00').toISOString() === '2026-11-16T21:00:00.000Z'`; in July: `'2026-07-01T15:00' → '2026-07-01T20:00:00.000Z'`
- [ ] **Step 3:** Run `node --test tests/unit/dates.test.js`. Expected: FAIL (module missing).
- [ ] **Step 4:** Implement `lib/dates.js` with `Intl.DateTimeFormat` (`timeZone: 'America/Chicago'`). Date-only strings are calendar dates: format them with `timeZone: 'UTC'`. Lower-case "am/pm".
- [ ] **Step 5:** Run the unit test. Expected: PASS.
- [ ] **Step 6: Write failing build test** `tests/build/base.test.js`: built `index.html` has `<title>` ending "Mary E. Courtenay Language Arts Center"; every `link[href]`, `script[src]` and `img[src]` that is site-relative starts with `/school-poc/`; `html[lang=en]`.
- [ ] **Step 7:** Replace the deprecated `| url` usage with Eleventy's `HtmlBasePlugin`; register filters and the `now` data; set `site.json` `name` to the official name; move existing alert fields out of `site.json` (Task 4 owns the new file — leave the base template rendering no alert for now).
- [ ] **Step 8:** Run `npm test`. Expected: PASS.
- [ ] **Step 9: Commit** `chore: test harness, path-prefix base, Chicago date helpers`.

---

### Task 2: Design tokens, fonts and base styles

**Agent:** `general-purpose`, model `sonnet`. **Load:** ui-ux-pro-max (Accessibility, Typography & Color rules).

**Files:**
- Create: `src/css/tokens.css`, `src/css/base.css`, `tests/unit/tokens.test.js`
- Modify: `eleventy.config.js` (passthrough Fontsource files to `/fonts/`), `src/_includes/layouts/base.njk` (stylesheet links), `package.json`
- Delete: `src/css/style.css`

**Interfaces:**
- Produces CSS custom properties named after DESIGN.md §5.2 with dots → dashes: `--color-text-primary`, `--color-text-secondary`, `--color-text-brand`, `--color-text-accent`, `--color-text-on-dark`, `--color-text-accent-on-dark`, `--color-text-on-accent`, `--color-surface-page|alt|brand|brand-strong|accent`, `--color-border-subtle|control`, `--color-action-primary-bg|fg`, `--color-action-secondary-bg|fg`, `--color-focus-on-light|on-dark`, `--color-status-emergency-bg|fg`, `--color-status-error-fg`; `--font-display`, `--font-body`, `--fs-display|h1|h2|h3|body|small|label` (fluid `clamp()` between the mobile and desktop values), `--space-1`…`--space-9`, `--radius-none|sm`, `--shadow-header`, `--z-header|menu|skip`, `--dur-fast|base|enter`, `--ease-out`.
- Base classes later tasks use: `.container`, `.section`, `.section--alt`, `.visually-hidden`, `.skip-link`, `.prose`.

- [ ] **Step 1: Write failing test** `tests/unit/tokens.test.js`: parse the primitive hex values from `tokens.css`; compute WCAG contrast; assert every pairing in DESIGN.md §5.3 is ≥ 4.5 (expected values 17.56, 7.96, 7.30, 13.21, 12.11, 13.21, 16.29, 8.66, 10.68, 10.68, 5.87, 5.39, 6.57 within ±0.05); assert gold-on-white < 3 (guards the rule); assert every semantic token resolves to a primitive.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Write `tokens.css` (primitives + semantic layer) and `base.css` (reset, body 17→18px/1.6 Barlow, headings in Oswald uppercase per §6, links underlined, `:focus-visible` 3px ring 2px offset, skip link, `scroll-padding-top` = header height, `prefers-reduced-motion` reset). Install `@fontsource/oswald` and `@fontsource/barlow`; pass only weights 500/700 and 400/500/600 through.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: design tokens, self-hosted fonts, base styles`.

---

### Task 3: Layout shell — icons, placeholder, header, navigation, footer

**Agent:** `general-purpose`, model `opus`. **Load:** ui-ux-pro-max (Touch & Interaction, `--domain ux "navigation accessibility z-index"`), design-motion-principles (menu open/close).

**Files:**
- Create: `src/_data/nav.json`, `src/_includes/partials/header.njk`, `src/_includes/partials/footer.njk`, `src/_includes/partials/placeholder.njk`, `src/css/components.css`, `src/js/site.js`, `src/images/logo.png` (copy of the current site's `header-logo.png`), `tests/build/shell.test.js`
- Modify: `src/_includes/layouts/base.njk`, `eleventy.config.js`, `src/_data/site.json`, `src/_data/strings.json`, `package.json`

**Interfaces:**
- Consumes: tokens (Task 2), `strings.json` (Task 1).
- Produces:
  - Shortcode `icon(name: string, label?: string)` → inline Lucide SVG from `lucide-static`, `class="icon"`, `aria-hidden="true"` unless `label` (then `role="img"` + `aria-label`).
  - Shortcode `placeholder(label: string, ratio: string)` → `<div class="ph" style="aspect-ratio:{ratio}" role="img" aria-label="Photo placeholder: {label}"><span>{label}</span></div>`.
  - `nav.json`: `[{ key, label, url }]` for about, families, enroll, news, contact. Dropdown children come from collection `section_<key>` (defined in Task 9); until then dropdowns render only when children exist.
  - `site.json` new keys: `fax`, `instagram`, `links: { parentPortal, lunchMenu, cpsCalendar, tourForm }` (external URLs; `tourForm` is a placeholder Google Form URL until the school creates one), `staffLinks: [{label,url}]`, `calendarIcs`.
  - `site.js` exports nothing; it self-initializes `[data-menu-toggle]`, `[data-search-toggle]`.

- [ ] **Step 1: Write failing build tests** `tests/build/shell.test.js` (homepage):
  - first focusable element in `body` is `a.skip-link[href="#main"]`; `main#main` exists
  - `header nav` has exactly 5 top-level links with labels About, Families, Enroll, News & Events, Contact
  - menu button has `aria-expanded="false"` and `aria-controls` pointing to an existing id
  - header contains no "Español" text
  - footer contains the official name, address, phone, fax, hours, a link labeled "Courtenay on Instagram" to the Instagram URL, a "Staff" link group, and no `facebook.com` or `twitter.com` link
  - header logo `img` has `alt=""` and the wordmark text "Courtenay Tigers" is live text
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement header (sticky navy bar, logo ≤ 48px, wordmark, search button, Menu button < 1024px, inline nav ≥ 1024px with click/Enter-opened dropdowns, gold active underline, `aria-current`), full-screen mobile menu (Esc closes and returns focus; rows ≥ 48px; quick tasks repeated at bottom; open/close 200ms per motion skill, none under reduced motion), and footer per DESIGN.md §10.12. Header gains `--shadow-header` after scroll.
- [ ] **Step 4:** Run `npm test`. Expected: PASS. Run `npm start`, check at 390 and 1440 by eye: menu opens, Esc closes, focus ring visible on navy.
- [ ] **Step 5: Commit** `feat: header, navigation, footer, icon and placeholder shortcodes`.

---

### Task 4: Alert banner

**Agent:** `general-purpose`, model `sonnet`.

**Files:**
- Create: `lib/alert.js`, `src/_settings/alert.json` (the CMS-edited file; kept outside `_data` so it doesn't clash with the loader), `src/_data/alert.js`, `tests/fixtures/alert-on.json`, `tests/fixtures/alert-off.json`, `src/_includes/partials/alert.njk`, `tests/unit/alert.test.js`, `tests/build/alert.test.js`
- Modify: `src/_includes/layouts/base.njk`, `src/js/site.js`, `src/css/components.css`

**Interfaces:**
- Consumes: `chicagoLocalToDate` (Task 1), `now` data.
- Produces: `isAlertActive(alert: {show: boolean, level: 'notice'|'closed'|'emergency', message: string, link?: string, start?: string, end?: string}, now: Date): boolean`. Eleventy filter `alertActive`. `src/_settings/alert.json` has exactly those keys; Eleventy must ignore `src/_settings/` as templates (`eleventyConfig.ignores.add`).

- [ ] **Step 1: Write failing unit tests:** inactive when `show` false, message empty, or `end` missing; active when `start ≤ now < end` in Chicago time; inactive before `start` and at/after `end`; `start` optional; `end: '2026-11-16T15:00'` is still active at `2026-11-16T20:59Z` and inactive at `21:00Z`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement `lib/alert.js`.
- [ ] **Step 4: Write failing build tests:** with fixture `alert.json` active for the test `SITE_NOW` (level `closed`), the page has one `.alert` above `header`, a visible label "CLOSED" from `strings.alertLabels`, `data-alert-end` set to the end as ISO UTC, and `role="status"` (emergency uses `role="alert"`); with `show: false` no `.alert` element exists. (The inactive case uses variant `no-alert` with env `ALERT_FILE=tests/fixtures/alert-off.json`; the default build uses `ALERT_FILE=tests/fixtures/alert-on.json`. `src/_data/alert.js` reads `ALERT_FILE` when set, else `src/_settings/alert.json`.)
- [ ] **Step 5:** Implement the partial and styles per DESIGN.md §10.1 (three levels, 4px gold bottom border on notice/closed, one or two lines, optional "Details" link, dismiss button for notice/closed storing the end time in `sessionStorage`, no dismiss for emergency). In `site.js`, remove the banner when `Date.now() ≥ data-alert-end`.
- [ ] **Step 6:** Run `npm test`. Expected: PASS.
- [ ] **Step 7: Commit** `feat: alert banner with Chicago-time expiry`.

---

### Task 5: Images, news cards, news list and post pages

**Agent:** `general-purpose`, model `opus`. Content: dispatch a `web-fetch` agent first to collect the current site's news (https://courtenay.cps.edu/apps/news/): title, date, text for the latest 6 posts.

**Files:**
- Create: `lib/news.js`, `src/_includes/partials/news-card.njk`, `src/_includes/layouts/post.njk`, `src/news/index.njk`, 4 more posts in `src/news/`, `tests/unit/news.test.js`, `tests/build/news.test.js`
- Modify: `src/news/news.json`, `eleventy.config.js`, `src/css/components.css`, `src/css/pages.css` (create)

**Interfaces:**
- Consumes: `placeholder`, `dateFormat`.
- Produces:
  - Post front matter: `title`, `date`, `summary`, `image?`, `image_alt?`. Collection `news` sorted newest first (`collections.newsDesc`).
  - `nextHeadlines(posts: Array<{url: string}>, currentUrl: string, n = 2): Array` — the n posts after the current one in newest-first order, wrapping to the newest; never includes the current post; returns fewer if not enough posts.
  - Partial `news-card.njk` taking `post`; renders the photo variant only when both `image` and `image_alt` exist, else the text-only variant (gold left bar).
  - Eleventy Image transform plugin: AVIF + WebP + original, widths `[400, 800, 1200]`, `loading="lazy"` and `decoding="async"` by default, width/height set.

- [ ] **Step 1: Write failing unit tests** for `nextHeadlines`: middle post → next two; last post → wraps to newest; 1 post total → `[]`; 2 posts → 1 result.
- [ ] **Step 2:** Run. Expected: FAIL. Implement. Run. Expected: PASS.
- [ ] **Step 3: Write failing build tests:**
  - each post has its own page at `/news/<slug>/` with one `h1` (the title, sentence case — no `text-transform: uppercase` class), the date in `'post'` format, and an "All news" link plus up to two next-headline links
  - `/news/` lists all posts as cards newest first; 13+ posts paginate at 12 (`/news/2/`)
  - a post with `image` but no `image_alt` renders the text-only card and no `img` (build logs a warning naming the file)
  - a 120-character title renders in full in the link's text (CSS clamps visually only)
- [ ] **Step 4:** Implement post permalinks (`news.json`: `permalink: /news/{{ page.fileSlug }}/`, `layout: layouts/post.njk`), list pagination, cards and styles per DESIGN.md §10.8 (mobile list with 120px thumbnails, 3 columns ≥ 1024px, date in Oswald `--color-text-accent`, card hover zooms photo 1.03). Migrate real posts from the web-fetch results (no images → text-only cards; skip stale enrollment items for past school years).
- [ ] **Step 5:** Run `npm test`. Expected: PASS.
- [ ] **Step 6: Commit** `feat: news cards, list and post pages with image pipeline`.

---

### Task 6: Google Calendar events

**Agent:** `general-purpose`, model `opus` (recurrence and time-zone logic).

**Files:**
- Create: `lib/events.js`, `src/_data/events.js`, `src/_data/sample-calendar.ics`, `src/_includes/partials/events-list.njk`, `src/events/index.njk`, `tests/fixtures/calendar.ics`, `tests/unit/events.test.js`, `tests/build/events.test.js`
- Delete: `src/_data/calendar.json`

**Interfaces:**
- Consumes: `formatDate`, `formatTime`, `site.calendarIcs`, `now`.
- Produces:
  - `type Event = { id: string, title: string, start: Date, end: Date, allDay: boolean, location: string, description: string }`
  - `upcomingEvents(icsText: string, now: Date, opts?: { days?: number = 365, limit?: number }): Event[]` — sorted ascending; includes an event whose `end > now`; expands RRULEs within `[now, now + days]`; drops EXDATE instances and `STATUS:CANCELLED`; all-day events keep their calendar date in Chicago.
  - Global data `events = { items: Event[], source: 'live'|'cache'|'file'|'none' }`. Source order: `CALENDAR_ICS_FILE` env (tests) → `site.calendarIcs` URL via `@11ty/eleventy-fetch` (`duration: '1h'`, `type: 'text'`) → on fetch error, the cached copy (`duration: '*'`) → `src/_data/sample-calendar.ics` when `calendarIcs` is empty → `{ items: [], source: 'none' }` with a console warning. Never throws.
  - Partial `events-list.njk` taking `items` and `limit`.

- [ ] **Step 1: Write the fixture** `tests/fixtures/calendar.ics` (Chicago TZID) containing: a past event; a single event on 2026-11-16 08:30–09:30 at "Room 108"; a weekly RRULE "PAC meeting" starting 2026-10-01 with an EXDATE on 2026-11-19; a cancelled event; an all-day event 2026-11-26; a multi-day event 2026-11-12 → 2026-11-14 that is in progress at `SITE_NOW`.
- [ ] **Step 2: Write failing unit tests** (`now = 2026-11-13T18:00Z`): past and cancelled events absent; in-progress multi-day event first; 2026-11-19 PAC instance absent while 2026-11-26 PAC instance present; all-day event has `allDay: true` and `formatDate(start,'list') === 'Thursday, Nov 26'`; `limit: 4` returns 4; malformed ICS text returns `[]` without throwing.
- [ ] **Step 3:** Run. Expected: FAIL. Implement with `node-ical` (`parseICS`, `rrule.between`, `exdate`). Run. Expected: PASS.
- [ ] **Step 4: Write failing build tests:** `/events/` shows all upcoming fixture events grouped by month, each with a navy date block (month + day), title, time ("8:30 am – 9:30 am" or "All day") and location; with variant `no-events` (`CALENDAR_ICS_FILE=tests/fixtures/empty.ics`) the page shows `strings.empty.events` ("No events scheduled — see the CPS calendar for district dates.") linking to `site.links.cpsCalendar`.
- [ ] **Step 5:** Implement the data file, partial, page and styles per DESIGN.md §10.9. Write `sample-calendar.ics` with weekly recurring sample events so the POC always shows upcoming items. Retire `calendar.json`.
- [ ] **Step 6:** Run `npm test`. Expected: PASS.
- [ ] **Step 7: Commit** `feat: Google Calendar events with recurrence and cache fallback`.

---

### Task 7: Homepage content model

**Agent:** `general-purpose`, model `sonnet`.

**Files:**
- Modify: `src/index.md` (front matter only in this task)
- Create: `tests/build/home-data.test.js`

**Interfaces:**
- Produces homepage front matter consumed by Task 8: `hero_heading` ("Curious minds."), `hero_highlight` ("Kind hearts."), `hero_sub`, `hero_image?`, `hero_alt?`, `hero_placeholder` ("Kids at recess"), `pride: [{value, label}] × 3` = `000`/Students, `PRE-K–8`/Grades, `00:1`/Student–teacher ratio, `welcome_title`, `welcome_photo_placeholder`, body = short principal welcome, `welcome_link` (URL of the full message page in About, created in Task 9).

- [ ] **Step 1: Write failing test:** `src/index.md` front matter parses and has exactly 3 `pride` items, each with non-empty `value` and `label`; `hero_heading` + `hero_highlight` ≤ 8 words total.
- [ ] **Step 2:** Run. Expected: FAIL. Update front matter. Run. Expected: PASS.
- [ ] **Step 3: Commit** `feat: homepage content model`.

---

### Task 8: Homepage composition

**Agent:** `general-purpose`, model `opus`. **Load:** design-taste-frontend (hero entrance, hover micro-interactions, photography rules; skip its page-kind dealing and gate), ui-ux-pro-max (`--domain landing "hero"`, `--domain ux "touch target"`), design-motion-principles (hero entrance ≤ 400ms once, card hover, button press).

**Files:**
- Modify: `src/_includes/layouts/home.njk`, `src/css/pages.css`, `src/css/components.css`, `eleventy.config.js` (`NEWS_EMPTY` hook)
- Create: `src/_includes/partials/hero.njk`, `src/_includes/partials/quick-tasks.njk`, `src/_includes/partials/pride.njk`, `tests/build/home.test.js`

**Interfaces:**
- Consumes: Task 7 front matter; `news-card` (Task 5); `events-list` + `events` (Task 6); `placeholder`, `icon`; `site.links`.
- Produces: partial `quick-tasks.njk` (reused by the mobile menu in Task 3 — replace that task's temporary list with this partial).

- [ ] **Step 1: Write failing build tests** for `/`:
  - section order inside `main`: hero → button pair → quick tasks → pride band → "Tiger news" → "Upcoming events" → welcome
  - exactly one `h1`, containing "Curious minds." and "Kind hearts."; the highlight is wrapped in an element with the gold-on-dark class
  - button pair: first link "Enroll now" to `/enroll/`, second "Book a tour" to `/about/tours/`
  - quick tasks: exactly 6 links, labels in the order of Global Constraints; Calendar → `/events/`, Enroll → `/enroll/`, Before & after care → `/families/before-after-care/`, Contact → `/contact/`; Lunch menu and Parent portal → `site.links.lunchMenu` / `site.links.parentPortal`
  - pride band: 3 items `000`, `PRE-K–8`, `00:1`
  - news: exactly the 3 newest posts as cards and a "See all news" link to `/news/`
  - events: at most 4 items from the fixture and a "See full calendar" link to `/events/`
  - with zero posts (variant `no-news`, env `NEWS_EMPTY=1`, which makes the `newsDesc` collection return `[]` — a test-only hook in `eleventy.config.js`) the news section and its heading are absent
  - no element on the page has a `marquee`, `[data-carousel]`, or `animation` declaration other than the hero entrance class
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement per DESIGN.md §10.3, §10.5–10.7, §11: full-bleed hero (photo or 4:5 mobile / 16:9 desktop placeholder) with navy-deep gradient overlay, display headline, ≈70vh mobile / ≤ 640px desktop; full-width button pair below the photo; 3×2 → 6×1 quick-task grid with dividers; gold pride band with the −55° stripe motif (the page's one motif use); "Tiger news" cards; events list; welcome on `--color-surface-alt`. Hero headline and buttons fade up once on load (`--dur-enter`), nothing else animates on load.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Run `npm start` and look at 390, 768, 1024, 1440: the quick tasks peek in on a 1440×900 screen; the 6 tiles fit at 320 without overflow.
- [ ] **Step 6: Commit** `feat: homepage hero, quick tasks, pride band, news and events`.

---

### Task 9: Inner pages, section navigation and migrated content

**Agent:** `web-fetch` to collect content, then `general-purpose`, model `sonnet`. **Load:** ui-ux-pro-max (`--domain ux "readability line length"`).

Content sources for the `web-fetch` agent (text only, keep facts, drop past-year notes): enrollment `https://courtenay.cps.edu/apps/pages/index.jsp?uREC_ID=554020&type=d`, mission `…uREC_ID=412940…`, tours `…412984…`, after school `…412988…`, payments `…412943…`, preschool `…412982…`, kindergarten readiness `…553912…`, contact and directions `/apps/contact/`, `/apps/maps/`.

**Files:**
- Create: `src/_includes/layouts/page.njk`, `src/_includes/partials/page-header.njk`, `src/about/index.md`, `src/about/{mission,tours,lsc-pac,volunteer,principal}.md`, `src/families/index.md`, `src/families/{before-after-care,payments,preschool,kindergarten-readiness,athletics}.md`, `src/enroll/index.md`, `src/contact/index.md`, `src/404.md`, `tests/build/pages.test.js`
- Delete: `src/about.md`
- Modify: `eleventy.config.js`, `src/_includes/partials/header.njk`, `src/css/pages.css`

**Interfaces:**
- Consumes: `nav.json`, header dropdown slot (Task 3).
- Produces: page front matter `title`, `intro?`, `section: about|families|enroll|contact`, `order: number`, `external_url?` (for menu-only links such as Lunch menu, Parent portal, CPS calendar). Collections `section_about`, `section_families`, `section_enroll`, `section_contact` sorted by `order`. Hub pages (`index.md` of each section) list their children as link rows. Markdown shortcodes for the body: `{% callout %}…{% endcallout %}` and `{% doc "label", "url", "PDF", "220 KB" %}`.

- [ ] **Step 1: Write failing build tests:**
  - every `nav` link and dropdown child resolves to a built file in `_test_site` (or is an external `https:` URL marked with the external icon and an accessible "(CPS site)" suffix)
  - every built HTML page has exactly one `h1`, no skipped heading levels, and the reading column class on its body
  - `/about/tours/`, `/enroll/`, `/families/preschool/`, `/contact/` exist and are non-empty
  - `/404.html` exists with links to Home and Contact
  - no page body contains "24-25" or "2024-2025" (stale content guard)
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement the page layout (navy page header with breadcrumb, H1, intro; stripe motif when the page has no other), body styles per DESIGN.md §10.10, callout and document-link shortcodes, collections, header dropdowns. Write the pages from the fetched content in plain language (DESIGN.md §14), with labeled placeholders where photos are needed. Contact page: address with "Get directions" (Google Maps search link), phone, fax, hours, map placeholder. Tours page ends with a primary "Request a tour" button to `site.links.tourForm` (opens the Google Form; DESIGN.md §10.14 form fields are not built in the POC because forms are Google Forms).
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: inner pages, section navigation, migrated content`.

---

### Task 10: Staff directory

**Agent:** `web-fetch` for `https://courtenay.cps.edu/apps/staff/` (names, roles, emails as published), then `general-purpose`, model `sonnet`.

**Files:**
- Create: `src/staff/index.njk`, `src/staff/people/*.md`, `src/staff/people/people.json`, `tests/build/staff.test.js`
- Modify: `src/js/site.js`, `src/css/pages.css`, `src/_data/nav.json` children (About → Our staff, Contact → Staff directory both link `/staff/`)

**Interfaces:**
- Produces: person front matter `name`, `role`, `group` (one of Administration, Pre-K, K–2, 3–5, 6–8, Specials, Support), `email?`, `photo?`, `photo_alt?`, `order?`. `people.json`: `permalink: false`, tag `staff`.

- [ ] **Step 1: Write failing build tests:** `/staff/` renders one card per person grouped under an `h2` per non-empty group in the fixed group order; a person without a photo shows an initials circle (`aria-hidden`) and no `img`; filter buttons exist with `aria-pressed`, and without JavaScript all people are visible.
- [ ] **Step 2:** Run. Expected: FAIL. Implement per DESIGN.md §10.11; the JS filter toggles `hidden` on groups and updates `aria-pressed`. Run `npm test`. Expected: PASS.
- [ ] **Step 3: Commit** `feat: staff directory`.

---

### Task 11: Search

**Agent:** `general-purpose`, model `sonnet`.

**Files:**
- Create: `src/search/index.njk`, `tests/build/search.test.js`
- Modify: `package.json` (`build` = `eleventy && pagefind --site _site`), `tests/helpers/build.js` (run Pagefind on `_test_site`), `src/_includes/layouts/base.njk` (`data-pagefind-body` on `main` for content pages only, not on `/search/` or `/404.html`), `src/_includes/partials/header.njk`, `src/js/site.js`, `src/css/components.css`

**Interfaces:**
- Produces: header search form (`GET` to `/search/`, field `q`, visible label "Search Courtenay"); `/search/` reads `q` and renders results with the Pagefind JS API as news-card-style rows; no-results text from `strings.search.none`.

- [ ] **Step 1: Write failing build tests:** `_test_site/pagefind/pagefind.js` exists; `/search/` has a labeled input and a results region with `aria-live="polite"`; the Pagefind script URL starts with `/school-poc/`; `/search/` and `/404.html` lack `data-pagefind-body`.
- [ ] **Step 2:** Run. Expected: FAIL. Implement per DESIGN.md §10.13 (search toggle expands a full-width field under the header on mobile, inline on desktop; spinner state while loading; message under the field on error). Run `npm test`. Expected: PASS.
- [ ] **Step 3: Commit** `feat: Pagefind search`.

---

### Task 12: Pages CMS configuration

**Agent:** `general-purpose`, model `sonnet`.

**Files:**
- Modify: `.pages.yml`
- Create: `tests/unit/cms-config.test.js`

**Interfaces:**
- Consumes: every content shape defined in Tasks 3–10 (`site.json`, `alert.json`, `index.md`, news, pages, staff).

- [ ] **Step 1: Write failing test** (parse `.pages.yml` with `yaml`):
  - entries exist for: School details, Alert banner, Homepage, News, About pages, Families pages, Enroll, Contact, Staff
  - every `type: image` field has a sibling field named `<name>_alt` (or `image_alt` / `photo_alt` / `hero_alt`) of type string
  - alert entry: `level` is a `select` with exactly `notice`, `closed`, `emergency`; `end` is a `date` with time enabled and `required: true`
  - news: `title`, `date`, `summary` required; filename pattern `{year}-{month}-{day}-{primary}.md`
  - every collection `path` exists on disk; no entry references `src/_data/calendar.json`
  - page entries expose `section` only as a hidden/fixed value and `order` as a number
- [ ] **Step 2:** Run. Expected: FAIL. Write `.pages.yml` with editor-friendly labels and `description` help text (e.g., alt text: "Describe what's happening in the photo for people who can't see it"). Media input `src/images`. Run `npm test`. Expected: PASS.
- [ ] **Step 3: Commit** `feat: Pages CMS configuration for all content`.

---

### Task 13: CI — tests, daily rebuild, Pagefind, accessibility report

**Agent:** `general-purpose`, model `sonnet`.

**Files:**
- Modify: `.github/workflows/deploy.yml`, `package.json`
- Create: `tests/a11y/site.spec.js`, `playwright.config.js`

**Interfaces:**
- Produces: `npm run test:a11y` (Playwright against a static server of the built site under `/school-poc/`, Chromium only).

- [ ] **Step 1: Write the a11y spec** (it will be run in Task 14): for each of `/`, `/news/`, one post, `/events/`, `/about/`, `/families/preschool/`, `/enroll/`, `/staff/`, `/contact/`, `/search/`, `/404.html`: zero axe violations (tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`); at widths 320, 390, 768, 1024, 1440 `document.documentElement.scrollWidth <= innerWidth`; Tab once focuses the skip link; at 390 every visible `a, button, input` outside `.prose` has a bounding box ≥ 44×44.
- [ ] **Step 2:** Update the workflow: triggers `push` (main), `workflow_dispatch`, `schedule: cron '0 10 * * *'`; job `test` runs `npm ci && npm test` and blocks deploy; build runs `npm run build` with `actions/cache` for `.cache/` (calendar fallback); job `a11y` runs `npm run test:a11y` with `continue-on-error: true` and uploads the report; deploy unchanged.
- [ ] **Step 3:** Run `npm run build && npm run test:a11y` locally. Expected: the suite runs; failures are fixed in Task 14, not here.
- [ ] **Step 4: Commit** `ci: tests, daily rebuild, search index, accessibility report`.

---

### Task 14: Quality pass with the design skills

**Agent:** `general-purpose`, model `opus`. **Load:** design-taste-frontend (checkers), ui-ux-pro-max (Pre-Delivery Checklist), design-motion-principles (audit mode). Then a separate `general-purpose` reviewer with superpowers:requesting-code-review and the design-system skill for the whole-branch review.

**Files:**
- Modify: whatever the checks flag (CSS, partials)
- Create: `.taste-skill/waivers.json`, `docs/qa/2026-11-poc-qa.md` (findings and screenshots list)
- Modify: `README.md` (editor guide: alerts, news, pages, staff, photos/alt text, Google Calendar; admin guide: inviting editors, running a build, where the a11y report lives)

- [ ] **Step 1:** Run `npm run test:a11y`. Fix every axe violation, overflow and tap-size failure. Re-run. Expected: PASS.
- [ ] **Step 2:** Add the sample Spanish labels from DESIGN.md §14 to a test-only strings override (`STRINGS_FILE=tests/fixtures/strings-es-sample.json`), build, and run the overflow check at 320. Expected: no overflow.
- [ ] **Step 3:** Run the design-taste-frontend checkers on the built homepage and one inner page (`check.mjs --sizes 1440x900,1024x768,768x1024,390x844`, `shoot.mjs` at each width, `perf.mjs`, `consistency.mjs --quick`). Fix real findings; waive conflicts listed in "Design skills and subagents" with the DESIGN.md section as reason.
- [ ] **Step 4:** Run the ui-ux-pro-max Pre-Delivery Checklist and DESIGN.md §17 Review checklist against the screenshots; record each item as pass/fixed in `docs/qa/2026-11-poc-qa.md`.
- [ ] **Step 5:** Run design-motion-principles in audit mode on the homepage (menu, hero entrance, card hover, button press). Fix anything outside DESIGN.md §12.
- [ ] **Step 6:** Lighthouse accessibility ≥ 95 on `/` and `/events/` (Chrome headless). Record scores.
- [ ] **Step 7:** Update `README.md`. Run `npm test && npm run test:a11y`. Expected: PASS.
- [ ] **Step 8: Commit** `chore: quality pass, waivers, QA report, editor guide`.
- [ ] **Step 9:** Whole-branch review (reviewer agent). Address findings, re-run tests, commit.
