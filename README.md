# Mary E. Courtenay Language Arts Center website

This is the school website. It is a proof of concept (POC). The website is static. Eleventy builds the pages from the content files in this repository. GitHub Pages hosts the pages. The principal and the office staff change the content in **Pages CMS**. The events come from the school's **Google Calendar**. The running cost is $0 each month.

- Live POC: `https://<owner>.github.io/school-poc/`
- Content editor: [app.pagescms.org](https://app.pagescms.org)
- Design rules: [`DESIGN.md`](DESIGN.md)
- How the parts fit together: [architecture spec](docs/superpowers/specs/2026-11-13-site-architecture-design.md)
- Latest quality check: [`docs/qa/2026-11-poc-qa.md`](docs/qa/2026-11-poc-qa.md)

This guide has two parts:

- [For editors](#for-editors): for the principal and the office staff.
- [For admins](#for-admins): for the person who looks after the repository.

---

## For editors

In this part:

- [Sign in](#sign-in)
- [Post news](#post-news)
- [Set and end an alert](#set-and-end-an-alert)
- [Edit pages](#edit-pages)
- [Update staff](#update-staff)
- [Add a photo and a photo description](#add-a-photo-and-a-photo-description)
- [Events come from Google Calendar](#events-come-from-google-calendar)
- [The lunch menu comes from CPS](#the-lunch-menu-comes-from-cps)

### Sign in

1. Open the email invitation from Pages CMS.
2. Click the link in the email. You do not need a GitHub account.
3. To sign in again, go to [app.pagescms.org](https://app.pagescms.org).
4. Enter the same email address.
5. Click the sign-in link that Pages CMS sends to you.
6. Select the Courtenay site. The menu on the left shows everything that you can change.

**When does a change go live?** The site rebuilds each time you click **Save**. Your change is live in a few minutes. Refresh the page to see it.

### Post news

1. Go to **News** → **Add an entry**.
2. Enter the **Title**, the **Date** and the **Summary**. Write one or two sentences for the summary. The summary shows on the news list and in search.
3. Write the story in **Story**.
4. Optional: add a **Photo** and a **Photo description**. See [Add a photo and a photo description](#add-a-photo-and-a-photo-description).
5. Click **Save**.

The homepage shows the three newest posts. Each post also has its own page.

### Set and end an alert

Use the alert for news that families must know today. Examples: a closure, an early dismissal or an emergency.

To set an alert:

1. Go to **Alert banner**.
2. Turn on **Show the banner**.
3. Select the **Type of alert**:
   - **Notice**: general news. Example: "Report card pick-up on Thursday".
   - **School closed**: no school. Example: "No school on Monday: staff development day".
   - **Emergency**: urgent safety news. It shows in red. Visitors cannot close it.
4. Write the **Message**. Use one or two sentences.
5. Optional: enter a **Link** to more details. Use a full web address. For a page on this site, use an address that starts with a slash. Example: `/news/`.
6. Optional: enter **Show from**. If you leave it empty, the alert shows immediately.
7. Enter **Hide after**. This field is required. Select the date and the time when the alert must disappear (Chicago time).
8. Click **Save**.

The alert disappears at the **Hide after** time. It does not wait for the next rebuild.

To end an alert early:

1. Turn off **Show the banner**.
2. Click **Save**.

**Note:** The website is not the only way to reach families in an emergency. The main way is the CPS mass notification.

### Edit pages

1. Go to **About pages**, **Families pages**, **Enroll page** or **Contact page**.
2. Open the page.
3. Change the **Page title**, the **Short introduction** or the **Content**.
4. Optional: change **Menu order**. This number sets the position of the page in the menu of its section. The page with the smallest number is first.
5. Click **Save**.

On **About pages**, the field **Portrait placeholder label** shows a labeled square placeholder at the top of the page. The principal's page uses it until a real photo is available.

Headings in **Content** fit under the page title automatically. A "Heading 1" shows as a section heading. A heading never skips a level.

Follow these writing rules:

- Use short sentences.
- Use headings that name the subject. Write "Lunch menu". Do not write "Nourishing young minds".
- For a link to a PDF file, write what the file is and its size. Example: "LSC minutes, Oct 2026 (PDF, 220 KB)".

The **Homepage** entry holds the headline, the three pride numbers and the principal's welcome. The site hides the pride numbers until the school confirms the real figures. Use only real numbers.

The **School details** entry holds the address, the phone number, the office hours and the links for the quick tasks. The quick tasks are the parent portal and the full lunch menu on MealViewer. These details show on every page.

### Update staff

To add a person:

1. Go to **Staff** → **Add an entry**.
2. Enter the **Name**. Include the title. Example: "Ms. Jane Smith".
3. Enter the **Job title**, the **Group** and the **Email**.
4. Click **Save**.

To change a person:

1. Go to **Staff**.
2. Open the entry of the person.
3. Change the entry.
4. Click **Save**.

To remove a person:

1. Go to **Staff**.
2. Open the entry of the person.
3. Delete the entry.

**Order within group** is optional. If you leave it empty, the directory sorts the group by name. If a person has no photo, the directory shows the initials of the person in a navy circle.

### Add a photo and a photo description

1. Click a photo field.
2. Upload the image. Use a JPG, PNG or WebP file.
3. Enter the **Photo description** next to the photo. Describe what happens in the photo. Example: "Second graders reading together in the library". Screen readers read this description aloud.
4. Click **Save**.

**Warning:** Use only photos of Courtenay students. Use only students that have a media release on file. Do not use stock photos.

**If a photo has no description, the site does not show the photo.** In that case:

- A news post uses the text-only card.
- A staff member shows initials.
- The homepage shows its labeled placeholder.

Nothing breaks. To show the photo, add a description and click **Save**.

The site makes smaller copies of each photo for phones automatically. Upload the original photo.

### Events come from Google Calendar

You do not enter events in Pages CMS. The site reads the school's Google Calendar.

- To add, change or delete an event, use Google Calendar.
- The homepage shows the next four events. The **Events** page shows all upcoming events.
- Past events disappear automatically. Each page hides an event when it ends. It does not wait for the next rebuild.
- A change shows after the next rebuild. The site rebuilds every morning at about 4–5 am (Chicago time). It also rebuilds when anyone clicks **Save** in Pages CMS. If you need a change sooner, ask an admin to run a build.
- Only events on that one calendar show on the site.

**Warning:** The calendar must stay public. The setting is "Make available to public — see all event details". If someone makes the calendar private, the site keeps the last copy that it read. New events do not show.

### The lunch menu comes from CPS

You do not enter the lunch menu in Pages CMS. CPS publishes the menu of each school on MealViewer. The site reads the Courtenay menu at each rebuild.

- The homepage shows **Today's menu** on a gold band. The band shows the lunch and the Pre-K snack. Pre-K to 8th grade eat the same lunch. On a weekend or a day off, the band shows the next school day.
- The **Lunch menu** page (Families → Lunch menu) shows breakfast, lunch and snacks for each day of this school week. On a weekend, it shows the coming week.
- The menu updates at the daily rebuild. CPS can change a menu with little notice.
- For allergens and nutrition, use the link to the full menu on MealViewer.

---

## For admins

In this part:

- [Invite and remove editors](#invite-and-remove-editors)
- [Run the site and the checks on your computer](#run-the-site-and-the-checks-on-your-computer)
- [Builds and deploys](#builds-and-deploys)
- [The accessibility report](#the-accessibility-report)
- [Connect the Google Calendar](#connect-the-google-calendar)
- [The lunch menu (MealViewer)](#the-lunch-menu-mealviewer)
- [Path prefix and custom domain](#path-prefix-and-custom-domain)
- [Open items before launch](#open-items-before-launch)
- [Where things live](#where-things-live)

### Invite and remove editors

To invite an editor:

1. Sign in to [app.pagescms.org](https://app.pagescms.org) with GitHub. You need write access to this repository.
2. Open the Courtenay project → **Settings** → **Collaborators**.
3. Enter the email address of the editor.
4. Send the invitation.

To remove an editor, remove the person from the same list.

**Before you invite the first editor, check the rich-text editor.** Some pages hold short codes. The editor must keep these codes exactly as they are. The short codes are:

- `{% callout %}` boxes
- `{% doc %}` document links
- `{% placeholder %}` photo placeholders

To do the check:

1. In Pages CMS, open each of these pages: **Enroll page**, **About pages** → **A message from the principal** and **Families pages** → **Kindergarten readiness**.
2. On each page, click **Save**. Do not change anything.
3. Go to **Actions**. Make sure that the run for each save has a green tick.
4. Open the three pages on the site. Compare them with the pages before the check:
   - the callout box on Enroll
   - the portrait placeholder on the principal's page
   - the PDF link on Kindergarten readiness
5. In the repository, read the changes that the saves made to `src/enroll/index.md`, `src/about/principal.md` and `src/families/kindergarten-readiness.md`.

**Caution:** Look for these two problems: quotes that became curly quotes, and `{%` that became `\{%`. Each problem means that the editor changes the short codes. If you find a problem, do not invite editors. Ask the developer.

The file [`.pages.yml`](.pages.yml) sets what editors can change. Keep at least two admins.

### Run the site and the checks on your computer

You need Node 26. The file `.nvmrc` shows the version.

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

The accessibility runs write an HTML report to `playwright-report/`. The Spanish run writes its report to `playwright-report-es/`.

### Builds and deploys

The workflow is `.github/workflows/deploy.yml` ("Deploy to GitHub Pages"). It runs in these cases:

- On each push to `main`. Each save in Pages CMS is a push.
- Each day at 10:00 UTC (4–5 am Chicago time). Expired alerts and past events then disappear before school starts.
- By hand: go to **Actions** → **Deploy to GitHub Pages** → **Run workflow**.

The workflow does these steps in order: test, build, deploy. If a test fails, the deploy stops. GitHub shows a red X in the **Actions** tab. GitHub also sends a message to the person whose save started the run.

The tests that gate the deploy never check what the content says. They use test copies of the content. They also edit a copy of the site in the same way as Pages CMS. For this reason, an editor's save cannot make them fail.

If an editor saves during a deploy, the new save waits. It publishes when the deploy ends.

**Warning:** GitHub turns off the daily rebuild after 60 days without an edit. This can happen in a summer break. In that case:

- Alerts and past events still disappear in the browser of the visitor when they end.
- New Google Calendar events do not show.

To turn the daily rebuild on again:

1. Go to **Actions** → **Deploy to GitHub Pages**.
2. Click **Enable workflow** in the banner.

A save in Pages CMS also rebuilds the site immediately. Do this check before each school year starts.

### The accessibility report

The `a11y` job runs after each build. **It never blocks publishing.** An editor's save always goes live.

To read the report:

1. Open the workflow run under **Actions**.
2. Go to **Artifacts** and download **a11y-report**.
3. Open `playwright-report/index.html`. For the Spanish-length check, open `playwright-report-es/index.html`.

A red `a11y` job shows a problem to fix. The usual causes are a missing photo description and a very long title.

The same job runs the content checks (`npm run test:content`). These checks make sure of the following:

- The text spells out jargon.
- The text has no old school year.
- The Contact page has the contact facts.

Read the report after each content change.

### Connect the Google Calendar

1. In Google Calendar, open the school calendar → **Settings and sharing** → **Access permissions**.
2. Select **Make available to public**. Select **See all event details**.
3. Copy the **Public address in iCal format**. It ends in `.ics`.
4. In Pages CMS, go to **School details** → **Google Calendar feed address**. This field is `site.calendarIcs` in `src/_data/site.json`.
5. Paste the address.
6. Click **Save**.

Until you set an address, the site shows the sample events in `src/_data/sample-calendar.ics`. If a build cannot read the feed, it keeps the last good copy. GitHub Actions caches this copy. The build does not fail.

### The lunch menu (MealViewer)

At each build, the site asks MealViewer for the menu of this week and of next week. It uses the school in `site.mealViewerSchool` (`src/_data/site.json`). Editors cannot change this value in the CMS. The value for Courtenay is `610355-51073`.

To find the value for another school:

1. Open `https://api.mealviewer.com/api/v4/physicalLocation/search/<school name>`.
2. Copy the `physicalLocationLookup` value.

If the build cannot reach MealViewer, it keeps the last copy of the menu of this week. The cache works in the same way as the calendar cache. The build does not fail. If no copy exists:

- The homepage hides the menu card.
- The Lunch menu page links to MealViewer.

The link to the full menu is in **School details** → **Full lunch menu link (MealViewer)**.

### Path prefix and custom domain

The POC uses a path prefix: `https://<owner>.github.io/school-poc/`. The deploy job sets `PATH_PREFIX` to `/<repository name>/`. Each link, image and search file uses this prefix. Editors never type the prefix. Links in the CMS start with a slash. Example: `/news/`.

To move to a custom domain (for example `courtenay.cps.edu`):

1. Get approval from CPS IT (Policy 604.10).
2. Ask CPS IT to point the DNS of the domain to GitHub Pages.
3. In the repository, go to **Settings** → **Pages** → **Custom domain**. Enter the domain.
4. In `deploy.yml`, set `PATH_PREFIX` of the build job to `/`.

**Note:** Do not change the `a11y` job. It serves the site under `/school-poc/` on purpose. Its local server maps that prefix.

### Open items before launch

- **Domain:** CPS IT must approve the use of `courtenay.cps.edu` for GitHub Pages. Until then, the site stays on the github.io address.
- **Repository ownership:** Move the repository from a personal account to a GitHub organization that the school controls. The organization needs at least two admins.
- **Logo:** Get the vector shield file from the school. The POC uses the 118×128 PNG from the old site.
- **Photos:** Get real Courtenay photos with media releases. They replace the labeled placeholders (hero, principal, preschool and others).
- **Pride facts:** Get the real numbers for the pride band. The band is hidden until then. To show the band, add `{% include "partials/pride.njk" %}` again to `src/_includes/layouts/home.njk`, after the quick tasks.
- **Google Calendar:** Get the public iCal address. See [Connect the Google Calendar](#connect-the-google-calendar).
- **Spanish (phase 2):** Bilingual staff must write the Spanish pages. The interface text is already in `src/_settings/strings.en.json`. The layout checks already use longer Spanish labels.

### Where things live

| Path | What it holds |
|---|---|
| `src/index.md` | Homepage content (hero, pride numbers, welcome) |
| `src/news/` | One file for each news post |
| `src/about/`, `src/families/`, `src/enroll/`, `src/contact/` | Inner pages |
| `src/staff/people/` | One file for each staff member |
| `src/_data/site.json` | School details, links, calendar address |
| `src/_settings/alert.json` | The alert banner |
| `src/_settings/strings.en.json` | All interface text (buttons, menus, labels) |
| `src/_includes/` | Templates and partials |
| `src/css/` | Design tokens and styles (`DESIGN.md`) |
| `tests/` | Unit, build and accessibility tests |
| `.pages.yml` | What Pages CMS lets editors change |
