# Build status — Courtenay site POC

**Plan:** `docs/superpowers/plans/2026-11-13-courtenay-site-poc.md` · **Branch:** `redesign`
**Current:** Task 3 in progress

Protocol: see the plan's "Progress log" section. Update after every step; resume from **Next**.

Status values: `todo` · `in progress` · `blocked` · `review` · `done`

---

## Task 1: Test harness, path-prefix-safe base, dates module
- **Status:** done
- **Agent:** implementer (sonnet), 2026-11-13
- **Steps done:** 1-9
- **Files touched:** lib/dates.js, eleventy.config.js, src/_data/{now.js,strings.js,site.json}, src/_settings/strings.en.json, base.njk, tests/*, package.json, .gitignore
- **Last command:** npm test -> PASS (8/8)
- **Next:** —
- **Blockers:** —
- **Commit / review:** 0931c68 · review: approved (3 minor notes parked for final review)

## Task 2: Design tokens, fonts and base styles
- **Status:** done
- **Commit / review:** ba52ba3 · review: approved (minor follow-ups carried to Task 3 / parked for Task 14)

## Task 3: Layout shell — icons, placeholder, header, navigation, footer
- **Status:** done
- **Agent:** implementer (opus), 2026-11-13
- **Steps done:** 1-5
- **Files touched:** lib/shortcodes.js, eleventy.config.js, package.json(+lock: lucide-static), src/_data/{site.json,nav.json}, src/_settings/strings.en.json, src/_includes/layouts/{base,home}.njk, src/_includes/partials/{header,footer,quick-tasks,placeholder}.njk, src/_includes/icons/instagram.svg, src/css/{components,base}.css, src/js/site.js, src/images/logo.png, tests/build/shell.test.js, tests/unit/shortcodes.test.js
- **Last command:** npm test -> PASS (40/40); headless Chrome check at 320/390/768/1024/1440 -> menu opens, Tab cycles, Esc closes + returns focus, gold rings on navy, no h-scroll
- **Next:** — (controller: review)
- **Blockers:** —
- **Commit / review:** commit "feat: header, navigation, footer, icon and placeholder shortcodes" · report: .superpowers/sdd/2026-11-13-courtenay-site-poc/task-3-report.md

## Task 4: Alert banner
- **Status:** todo
- **Next:** Step 1

## Task 5: Images, news cards, news list and post pages
- **Status:** todo
- **Next:** web-fetch current news, then Step 1

## Task 6: Google Calendar events
- **Status:** todo
- **Next:** Step 1

## Task 7: Homepage content model
- **Status:** todo
- **Next:** Step 1

## Task 8: Homepage composition
- **Status:** todo
- **Next:** Step 1

## Task 9: Inner pages, section navigation and migrated content
- **Status:** todo
- **Next:** web-fetch content pages, then Step 1

## Task 10: Staff directory
- **Status:** todo
- **Next:** web-fetch staff page, then Step 1

## Task 11: Search
- **Status:** todo
- **Next:** Step 1

## Task 12: Pages CMS configuration
- **Status:** todo
- **Next:** Step 1

## Task 13: CI — tests, daily rebuild, Pagefind, accessibility report
- **Status:** todo
- **Next:** Step 1

## Task 14: Quality pass with the design skills
- **Status:** todo
- **Next:** Step 1

---

## Log
- 2026-11-13 — plan approved; status log created.
