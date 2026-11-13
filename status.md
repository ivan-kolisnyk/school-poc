# Build status — Courtenay site POC

**Plan:** `docs/superpowers/plans/2026-11-13-courtenay-site-poc.md` · **Branch:** `redesign`
**Current:** All tasks done; PR #1 open. Open item: make tests/regression/cms-edits.test.js content-independent before inviting editors.

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
- **Status:** done
- **Agent:** implementer (opus), 2026-11-13
- **Steps done:** Step 1 (a11y suite green), Step 2 (Spanish sample at 320: npm run test:a11y:es), carry-over 1–13
- **Files touched:** see .superpowers/sdd/2026-11-13-courtenay-site-poc/task-14a-report.md
- **Last command:** npm test -> PASS 195/195; npm run test:a11y -> PASS 95/95; npm run test:a11y:es -> PASS 58/58
- **Next:** — (14b: steps 3–8)
- **Blockers:** —
- **Commit / review:** 174b717, 3c500d1, 94cf41f, ec5a417
### 14b (steps 3–8)
- **Status:** done
- **Agent:** implementer (opus), 2026-11-13
- **Steps done:** Step 3 (taste checkers, fixes, .taste-skill/waivers.json), Step 4 (DESIGN §17 + ui-ux-pro-max checklist in docs/qa/2026-11-poc-qa.md), Step 5 (motion audit; link-row hover nudge removed), Step 6 (Lighthouse 13.6.0: a11y 100 on / and /events/), Step 7 (README editor/admin guide), Step 8 (commit)
- **Files touched:** see .superpowers/sdd/2026-11-13-courtenay-site-poc/task-14b-report.md
- **Last command:** npm test -> PASS 200/200; npm run test:a11y -> PASS 95/95; npm run test:a11y:es -> PASS 58/58
- **Next:** — (Step 9 whole-branch review is the controller's)
- **Blockers:** —
- **Commit / review:** 8cc02c1

## Final review fixes (final-fix-brief.md: C1, I1–I4, Minor 1, 5, 7, 9, 10, 11, 13)
- **Status:** done
- **Agent:** implementer (opus), 2026-11-13
- **Steps done:** C1 (content-independent gating suite: invariants from source + fixtures, PAGES_FIXTURES_DIR hook, bodyHeadings normalization, CALENDAR_ICS_FILE enforced, tests/content non-gating, tests/regression CMS-edit copy runs test:gating), I1, I2 (a/b/c), I3 (+ Playwright), I4, Minor 1/5/7/9/10/11/13, ledger Task 7 + Task 12 #1 (found and removed dead `site.tagline`)
- **Files touched:** see .superpowers/sdd/2026-11-13-courtenay-site-poc/final-fix-report.md
- **Last command:** npm test -> PASS 229/229; npm run test:a11y -> PASS 98/98; npm run test:a11y:es -> PASS 58/58; npm run test:content -> PASS 7/7
- **Next:** — (controller: re-review)
- **Blockers:** —
- **Commit / review:** 67720c6, 80c0202, + clean-URL follow-up (filename {primary}.md for About/Families)

---

## Log
- 2026-11-13 — plan approved; status log created.
- 2026-11-13 — Final review fixes started (final-fix-brief.md).
- 2026-11-13 — Final review fixes done (67720c6, 80c0202); report in final-fix-report.md.
- 2026-11-13 — Final review follow-up: new About/Families pages get slug-only file names (clean URLs).
