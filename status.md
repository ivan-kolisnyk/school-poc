# Build status — Courtenay site POC

**Plan:** `docs/superpowers/plans/2026-11-13-courtenay-site-poc.md` · **Branch:** `redesign`
**Current:** Task 14 in progress

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
- **Commit / review:** 9361db2 (+status commit) · review: approved (5 minor notes parked)

## Task 9: Inner pages, section navigation and migrated content
- **Status:** done
- **Commit / review:** 5464da9, 0e95548 (+status commits) · review: approved after 1 fix round

## Task 10: Staff directory
- **Status:** done
- **Commit / review:** d311926 · review: approved (6 minor notes parked)

## Task 11: Search
- **Status:** done
- **Commit / review:** 1dba05c, ad04c5f · review: approved after 1 fix round

## Task 12: Pages CMS configuration
- **Status:** done
- **Commit / review:** 1f99378, e63ba48, ebfc46c · review: approved; cross-task fix a0756dd (staff email/photo rendering) in re-review

## Task 13: CI — tests, daily rebuild, Pagefind, accessibility report
- **Status:** done
- **Commit / review:** 7420cab · review: approved (local a11y run: 11 tap-target failures handed to Task 14)

## Task 14: Quality pass with the design skills
### 14a (steps 1–2 + carry-over items 1–13)
- **Status:** in progress
- **Agent:** implementer (opus), started 2026-11-13
- **Steps done:** Step 1, Step 2 (Spanish sample at 320: npm run test:a11y:es), carry-over 1–13
- **Files touched:** tests/fixtures/strings-es-sample.json, tests/a11y/es-overflow.spec.js, playwright.config.js, tests/a11y/serve.js, package.json, .gitignore, src/css/components.css (narrow tile padding), tests/unit/{strings,workflow}.test.js, .github/workflows/deploy.yml
- **Last command:** npm test -> PASS; npm run test:a11y -> PASS 95/95; npm run test:a11y:es -> PASS 58/58
- **Next:** commit Step 2 + CI; write task-14a-report.md; mark done
- **Blockers:** —
### 14b (steps 3–8)
- **Status:** todo

---

## Log
- 2026-11-13 — plan approved; status log created.
