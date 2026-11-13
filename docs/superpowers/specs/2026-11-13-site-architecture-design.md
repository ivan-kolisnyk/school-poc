# Courtenay website: architecture and content design

**Status:** draft for review · **Date:** 2026-11-13 · **Companion to:** [`DESIGN.md`](../../../DESIGN.md) (visual design)

## 1. Intent

Replace the vendor-hosted courtenay.cps.edu (Educational Networks) with a site the school owns, that costs nothing to run, and that the **principal and office staff** can keep current without technical help. The work starts as a proof of concept (POC) and becomes the real site later.

## 2. Constraints and decisions so far

| Topic | Decision |
|---|---|
| Editors | Principal and office staff only — a handful of non-technical people. No teacher class pages. |
| Budget | $0/month target. |
| Lock-in | Content must stay as plain files the school owns; any tool must be swappable. |
| Accessibility | WCAG 2.1 AA is a legal requirement for CPS under ADA Title II (deadline currently April 26, 2027). `DESIGN.md` targets WCAG 2.2 AA, which covers it. |
| Language | POC is English only. Spanish follows in phase 2, written by bilingual staff. The build must be Spanish-ready. |
| Scope | No logins, no student data, no comments, no newsletter sending. Parent portal, lunch menu and CPS calendar stay as links to CPS systems. |

## 3. Approaches considered

| Option | Cost | Verdict |
|---|---|---|
| **Keep Eleventy + GitHub Pages + Pages CMS, with fixes** | $0 | **Chosen.** Free, no server to secure, full control of markup (needed for accessibility), no lock-in. Editor set is small, so the simple form-style editor is enough. |
| Same site with Sveltia CMS | $0 | Better multilingual editing, but every editor needs a GitHub account plus an auth service. Revisit for phase 2 if Spanish editing is awkward in Pages CMS. |
| Same site with CloudCannon / TinaCMS | Paid beyond 2 editors | Visual on-page editing; not needed for a few office editors. |
| WordPress (managed hosting) | ~$10–30/mo | Familiar, but plugins/updates to maintain, and editors can break design and accessibility. |
| Google Sites | $0 | Can't implement `DESIGN.md`; weak accessibility control. |
| Squarespace / Wix | ~$17–30/mo | Replaces one vendor with another. |

## 4. Architecture

```
Office staff ──► Pages CMS (email invite, no GitHub account)
                     │ commits Markdown/JSON + images
                     ▼
              GitHub repo (main) ◄── Google Calendar (iCal feed, read at build)
                     │ push / daily schedule / manual
                     ▼
              GitHub Actions: Eleventy build → image optimisation → Pagefind index
                     ▼
              GitHub Pages ──► courtenay.cps.edu (later, via CPS IT DNS)
```

- **Site generator:** Eleventy 3 (already in place), Nunjucks templates, Markdown content.
- **CMS:** Pages CMS. Editors are invited as email collaborators; repo admins (at least two) manage `.pages.yml` and invitations.
- **Hosting:** GitHub Pages via the existing Actions workflow.
- **Rebuild triggers:** every CMS save (push to `main`), a **daily scheduled build** (early morning, Chicago time) so expired alerts and past events drop off, and a manual "Run workflow" button.
- **Publish delay:** about 1–2 minutes after saving. For true emergencies, the website is not the only channel (CPS mass notifications remain primary).

## 5. Content model (what editors see in the CMS)

Every image field has a **required** alt-text field next to it. All dates use the CMS date picker.

| CMS entry | Fields | Notes |
|---|---|---|
| **School details** | Name, address, phone, fax, email, office hours, Instagram URL | Already exists; name corrected to "Mary E. Courtenay Language Arts Center". |
| **Alert banner** | Show (on/off), level (Notice / Closed / Emergency), message, optional link, **start** and **end** date-time (end required) | Hidden outside its window. The page also checks the end time in the browser, so an alert disappears on time even before the next rebuild. |
| **Homepage** | Hero headline, gold phrase, supporting line, hero photo + alt, three pride facts (value + label), short principal welcome + link | Pride facts start as placeholders (`000`, `PRE-K–8`, `00:1`). |
| **News** | Title, date, optional photo + alt, short summary, story | Each post gets its own page (today posts have none). No photo → text-only card. |
| **Pages** | Title, intro line, section (About / Families / Enroll / Contact), menu order, body, optional documents | Drives the inner pages and the navigation dropdowns. Body supports the callout box and document links from `DESIGN.md`. |
| **Staff directory** | Name, role, group, email, optional photo + alt | Groups: Administration, Pre-K, K–2, 3–5, 6–8, Specials, Support. |
| **Documents** | Uploaded through the CMS media library (PDFs) | Linked from pages with type and size shown. |
| **Quick links** | Fixed six tasks in code; their URLs (parent portal, lunch menu, care) editable in School details | Keeps the homepage grid stable. |

**Events** come from the school's existing **Google Calendar** (requirement, confirmed 2026-11-13). Staff keep adding events there as they do today; nothing is entered twice. The build reads the calendar's public iCal feed, shows the next 4 events on the homepage and a full upcoming list on the Events page, and links to the CPS district calendar. Event title, date/time, location and description come from the calendar entry. If the feed can't be fetched, the build keeps the last successful copy rather than failing. The CMS `calendar.json` list is retired.

The calendar must be set to public ("Make available to public — see all event details") for its iCal feed to be readable; only events on that calendar appear on the site.

## 6. Supporting pieces

- **Images:** editors upload originals; the build creates resized AVIF/WebP versions with `srcset`, width/height set (Eleventy Image).
- **Search:** Pagefind runs after the build and creates a static search index — no server, no cost.
- **Forms** (tour requests, contact): link to a Google Form owned by the school, opened from a button. No form backend to host. (Linking rather than embedding avoids iframe accessibility problems.)
- **Interface text:** all labels (buttons, nav, quick tasks, alert labels, empty states, date formats) in one strings file (`src/_data/strings.json`), so Spanish can be added in phase 2 by adding a second language file and `/es/` pages.
- **Accessibility checks:** an automated axe check runs on the built pages in GitHub Actions and reports problems. It does not block publishing, so an editor's save always goes live; the report is reviewed by an admin.
- **Analytics:** none in the POC. (Phase 2 option: a privacy-friendly, cookie-free counter.)

## 7. Domain and ownership (actions outside the code)

1. **CPS IT:** ask whether a school may point `courtenay.cps.edu` to self-hosted GitHub Pages, and what approval is needed (CPS requires district approval for educational technology, Policy 604.10). Until then the POC lives on the github.io address.
2. **Repository ownership:** before launch, move the repo from a personal account to a GitHub organization the school controls, with at least two admins, so the site survives staff changes.
3. **Content migration:** copy the current site's real content (enrollment steps, preschool, kindergarten readiness, after-care, tours, LSC documents, staff list) into the new pages. Stale items (old LSC folders, past-year enrollment notes) are left out.

## 8. POC scope

Built with the `DESIGN.md` components and placeholder photos:

- Homepage (alert, hero, quick tasks, pride band, news, events, welcome)
- News list and news post pages
- Events page
- About (mission and values, tours, LSC & PAC, volunteer)
- Families hub and its pages (before/after care, payments, preschool, kindergarten readiness, athletics)
- Enroll
- Staff directory
- Contact (with directions)
- Search results page and a 404 page
- CMS configuration for every entry in section 5, daily rebuild, accessibility check

Not in the POC: Spanish, custom domain, analytics, real photos and pride facts.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Pages CMS is a small open-source project | Content is plain files; switching to Sveltia/Decap CMS changes only the editor config. |
| Editors forget to end alerts or add alt text | End date and alt text are required fields; alerts expire automatically. |
| Google Calendar feed fails or is made private | Build keeps the last good copy; admins get the Actions failure email. |
| Site depends on one volunteer developer | Repo in a school-owned organization, two admins, README with editor and admin instructions. |
| CPS doesn't allow the domain change | Found out early (section 7); the site still works on its own address while that's resolved. |

## 10. Open questions

1. ~~Does the office keep a Google Calendar?~~ Yes — it is the events source.
2. The calendar's public iCal address (from Google Calendar → Settings → "Public address in iCal format"). The POC uses a sample feed until then.
3. Who will be the second repo admin?
