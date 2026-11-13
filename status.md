# Build status — Courtenay site POC

**Plan:** `docs/superpowers/plans/2026-11-13-courtenay-site-poc.md` · **Branch:** `redesign`
**Current:** Task 5 done, awaiting review

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
- **Commit / review:** 49f3375, 1b11edd · review: approved (8 minor notes routed to Tasks 8, 9, 14)

## Task 4: Alert banner
- **Status:** done
- **Commit / review:** 38c00b1, 09325b3 · review: approved after 1 fix round (invalid dates, dismiss focus, prefixed link test)

## Task 5: Images, news cards, news list and post pages
- **Status:** done
- **Commit / review:** 0d35864, 941946d (+status commits) · review: approved (6 minor notes parked)

## Task 6: Google Calendar events
- **Status:** done
- **Commit / review:** 42f71d0, ce917c7 (+status commits) · review: approved (6 minor notes parked)

## Task 7: Homepage content model
- **Status:** done
- **Commit / review:** 465492f · review: approved (3 minor notes parked)

## Task 8: Homepage composition
- **Status:** done
- **Agent:** implementer (opus), 2026-11-13
- **Steps done:** 1-6 (skills loaded: design-taste-frontend, ui-ux-pro-max, design-motion-principles; visual check at 1440/1024/768/390/320)
- **Files touched:** tests/build/home.test.js, src/_data/paths.js, src/_includes/partials/{hero,pride,quick-tasks}.njk, layouts/{home,post}.njk, src/_settings/strings.en.json, eleventy.config.js, src/css/{components,pages}.css
- **Last command:** npm test -> PASS (126/126)
- **Next:** — (awaiting review; report: .superpowers/sdd/2026-11-13-courtenay-site-poc/task-8-report.md)
- **Blockers:** —
- **Commit / review:** 9361db2 · review: pending

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
