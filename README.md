# Mary E. Courtenay Language Arts Center website

The school website, built as a proof of concept (POC). It is a static site: Eleventy builds plain pages from the content files in this repository, GitHub Pages hosts them, and the principal and office staff edit the content in **Pages CMS**. Events come from the school's **Google Calendar**. Running cost: $0 a month.

- Live POC: `https://<owner>.github.io/school-poc/`
- Content editor: [app.pagescms.org](https://app.pagescms.org)
- Design rules: [`DESIGN.md`](DESIGN.md) · How it fits together: [architecture spec](docs/superpowers/specs/2026-11-13-site-architecture-design.md) · Latest quality check: [`docs/qa/2026-11-poc-qa.md`](docs/qa/2026-11-poc-qa.md)

This guide has two parts: **For editors** (principal and office staff) and **For admins** (whoever looks after the repository).

---

## For editors

### Sign in

1. Open the email invitation from Pages CMS and click the link. You do not need a GitHub account.
2. Next time, go to [app.pagescms.org](https://app.pagescms.org), enter the same email address and click the sign-in link it sends you.
3. Pick the Courtenay site. The menu on the left lists everything you can edit.

**When does a change go live?** Every time you click **Save**, the site rebuilds. Your change is live in a few minutes. Refresh the page to see it.

### Post news

1. Go to **News** → **Add an entry**.
2. Fill in **Title**, **Date** and **Summary** (one or two sentences; it shows on the news list and in search).
3. Write the story in **Story**.
4. Optional: add a **Photo** and its **Photo description** (see [Photos](#add-a-photo-and-describe-it)).
5. Click **Save**.

The homepage shows the three newest posts. Every post also gets its own page.

### Set an alert, and end it

Use the alert for things families must know today: a closure, an early dismissal, an emergency.

1. Go to **Alert banner**.
2. Turn on **Show the banner**.
3. Pick the **Type of alert**:
   - **Notice**: general news (for example: "Report card pick-up on Thursday").
   - **School closed**: no school (for example: "No school on Monday: staff development day").
   - **Emergency**: urgent safety news. It shows in red and cannot be closed by visitors.
4. Write the **Message**. Keep it to one or two sentences.
5. Optional: a **Link** to more details. Use a full web address, or a page on this site starting with a slash, like `/news/`.
6. Optional: **Show from**. Leave it empty to show the alert right away.
7. **Hide after** is required. Pick the date and time the alert should disappear (Chicago time).
8. Click **Save**.

The alert disappears by itself after the **Hide after** time, even before the next rebuild. To end it early, turn off **Show the banner** and click **Save**.

The website is not the only channel in an emergency. CPS mass notifications remain the main way to reach families.

### Edit pages

1. Go to **About pages**, **Families pages**, **Enroll page** or **Contact page**.
2. Open the page and change the **Page title**, **Short introduction** or **Content**.
3. **Menu order** sets where the page appears in its section's menu. Smaller numbers come first.
4. Click **Save**.

On **About pages**, **Portrait placeholder label** shows a labeled square photo placeholder at the top of the page. The principal's page uses it until a real photo exists.

Headings in **Content** fit under the page title by themselves: a "Heading 1" shows as a section heading, and a heading never skips a level.

Write plainly: short sentences, and headings that name the thing ("Lunch menu", not "Nourishing young minds"). When you link to a PDF, say what it is and its size, for example "LSC minutes, Oct 2026 (PDF, 220 KB)".

The **Homepage** entry holds the headline, the three pride numbers and the principal's welcome. The pride numbers are placeholders (`000`, `00:1`) until the school confirms the real figures. Use real numbers only.

**School details** holds the address, phone, office hours and the links behind the quick tasks (parent portal, lunch menu). These appear on every page.

### Update staff

1. Go to **Staff**.
2. To add someone: **Add an entry**, then fill in **Name** (with title, for example "Ms. Jane Smith"), **Job title**, **Group** and **Email**.
3. To change someone: open their entry, edit it, **Save**.
4. To remove someone: open their entry and delete it.

**Order within group** is optional. Leave it empty to sort by name. Without a photo, the directory shows the person's initials in a navy circle.

### Add a photo, and describe it

1. In a photo field, click it and upload the image (JPG, PNG or WebP). Use photos of Courtenay students only, and only students with a media release on file. Never use stock photos.
2. Fill in the **Photo description** next to it. Describe what is happening, for example "Second graders reading together in the library". People who use screen readers hear this description.

**If a photo has no description, the site does not show the photo.** A news post then uses the text-only card, a staff member shows their initials, and the homepage shows its labeled placeholder. Nothing breaks, but the photo stays hidden until you add a description and save.

The site makes smaller copies of every photo for phones by itself. Upload the original.

### Events come from Google Calendar

Events are not entered in Pages CMS. The site reads the school's Google Calendar:

- Add, change or delete events in Google Calendar, as you do today.
- The homepage shows the next four events; the **Events** page shows all upcoming events. Past events drop off by themselves: each page hides an event once it has ended, even before the next rebuild.
- Changes appear after the next rebuild: every morning (about 4–5 am Chicago time), or straight after anyone saves something in Pages CMS. Need it sooner? Ask an admin to run a build.
- **The calendar must stay public** ("Make available to public — see all event details"). If it is made private, the site keeps showing the last copy it read, and new events stop appearing.
- Only events on that one calendar appear on the site.

---

## For admins

### Invite and remove editors

1. Sign in to [app.pagescms.org](https://app.pagescms.org) with GitHub (you need write access to this repository).
2. Open the Courtenay project → **Settings** → **Collaborators**.
3. Enter the editor's email address and send the invitation. To remove someone, remove them from the same list.

**Before you invite the first editor, check the rich-text editor once.** Some pages hold short codes the editor must keep exactly as typed: `{% callout %}` boxes, `{% doc %}` document links and `{% placeholder %}` photo placeholders.

1. In Pages CMS, open each of these pages and click **Save** without changing anything: **Enroll page**, **About pages** → **A message from the principal**, and **Families pages** → **Kindergarten readiness**.
2. Under **Actions**, check that the run for each save passed (green tick).
3. Open the three pages on the site and compare them with before: the callout box on Enroll, the portrait placeholder on the principal's page, the PDF link on Kindergarten readiness.
4. In the repository, look at the changes those saves made to `src/enroll/index.md`, `src/about/principal.md` and `src/families/kindergarten-readiness.md`. Quotes turned into curly quotes, or `{%` turned into `\{%`, mean the editor changes short codes: stop and ask the developer before inviting editors.

What editors can change is set in [`.pages.yml`](.pages.yml). Keep at least two admins.

### Run the site and the checks on your computer

Needs Node 24.

```bash
npm install
npm start              # live preview at http://localhost:8080/ (no path prefix)
npm test               # the deploy gate: unit tests, build tests, CMS-edit check
npm run test:content   # house rules on today's content (plain language, migration)
npm run build:ci       # production build into _site/ under /school-poc/
npx playwright install chromium   # once, before the first accessibility run
npm run test:a11y      # axe, overflow and tap-size checks on the built site (run build:ci first)
npm run test:a11y:es   # the same layouts with ~25% longer sample Spanish labels, at 320px
```

The accessibility runs write an HTML report to `playwright-report/` (and `playwright-report-es/`).

### Builds and deploys

The workflow is `.github/workflows/deploy.yml` ("Deploy to GitHub Pages"). It runs:

- on every push to `main` (each Pages CMS save is a push),
- every day at 10:00 UTC (4–5 am Chicago), so expired alerts and past events drop off before school,
- by hand: **Actions** → **Deploy to GitHub Pages** → **Run workflow**.

The order is test → build → deploy. A failed test stops the deploy: GitHub shows a red X in the **Actions** tab and notifies the person whose save triggered it. The tests that gate the deploy never check what the content says (they use test copies, and a check that edits a copy of the site the way Pages CMS does), so an editor's save cannot fail them. A save made while a deploy is running waits for it to finish, then publishes.

**If nobody edits the site for 60 days** (a summer break, for example), GitHub turns off the daily rebuild for this repository. Alerts and past events still disappear in visitors' browsers when they end, but new Google Calendar events stop appearing. To turn it back on: **Actions** → **Deploy to GitHub Pages** → click **Enable workflow** in the banner. Any Pages CMS save also rebuilds the site straight away. Check this before each school year starts.

### The accessibility report

The `a11y` job runs after each build. **It never blocks publishing**, so an editor's save always goes live. To read it: open the workflow run under **Actions** → **Artifacts** → download **a11y-report** → open `playwright-report/index.html` (and `playwright-report-es/index.html` for the Spanish-length check). A red `a11y` job means something to fix, usually a missing photo description or a very long title. The same job runs the content checks (`npm run test:content`): jargon spelled out, no stale school year, the contact facts on the Contact page. Check the report after content changes.

### Connect the Google Calendar

1. In Google Calendar: the school calendar → **Settings and sharing** → **Access permissions**: tick **Make available to public** with **See all event details**.
2. Copy **Public address in iCal format** (ends in `.ics`).
3. In Pages CMS → **School details** → **Google Calendar feed address** (`site.calendarIcs` in `src/_data/site.json`), paste the address and save.

Until an address is set, the site shows the sample events in `src/_data/sample-calendar.ics`. If the feed cannot be read during a build, the build keeps the last good copy (cached in GitHub Actions) instead of failing.

### Path prefix and custom domain

The POC lives under a path prefix: `https://<owner>.github.io/school-poc/`. The deploy job sets `PATH_PREFIX` to `/<repository name>/`, and every link, image and search file is built under it. Editors never type the prefix: links in the CMS start with a slash, like `/news/`.

To move to a custom domain (for example `courtenay.cps.edu`):

1. Get CPS IT approval first (Policy 604.10) and have CPS IT point the domain's DNS to GitHub Pages.
2. In the repository: **Settings** → **Pages** → **Custom domain**.
3. In `deploy.yml`, set the build job's `PATH_PREFIX` to `/`.
4. The `a11y` job serves the site under `/school-poc/` on purpose (its local server maps that prefix); leave it as is.

### Open items before launch

- **Domain:** CPS IT approval to point `courtenay.cps.edu` at GitHub Pages. Until then the site stays on the github.io address.
- **Repository ownership:** move the repository from a personal account to a GitHub organization the school controls, with at least two admins.
- **Logo:** the vector shield file from the school (the POC uses the 118×128 PNG from the old site).
- **Photos:** real Courtenay photos with media releases, to replace the labeled placeholders (hero, principal, preschool and others).
- **Pride facts:** the real numbers for the pride band (`000` students, `00:1` ratio are placeholders; `PRE-K–8` is real).
- **Google Calendar:** the public iCal address (see above).
- **Spanish (phase 2):** Spanish pages written by bilingual staff. Interface text already lives in `src/_settings/strings.en.json`, and layouts are checked with longer Spanish labels.

### Where things live

| Path | What |
|---|---|
| `src/index.md` | Homepage content (hero, pride numbers, welcome) |
| `src/news/` | One file per news post |
| `src/about/`, `src/families/`, `src/enroll/`, `src/contact/` | Inner pages |
| `src/staff/people/` | One file per staff member |
| `src/_data/site.json` | School details, links, calendar address |
| `src/_settings/alert.json` | The alert banner |
| `src/_settings/strings.en.json` | All interface text (buttons, menus, labels) |
| `src/_includes/` | Templates and partials |
| `src/css/` | Design tokens and styles (`DESIGN.md`) |
| `tests/` | Unit, build and accessibility tests |
| `.pages.yml` | What Pages CMS lets editors change |
