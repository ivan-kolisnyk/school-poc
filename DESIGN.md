# Courtenay website: design guidelines

**Status:** draft for review · **Date:** 2026-11-12 · **Scope:** visual and interaction design only (backend, CMS and hosting are a separate discussion)

These guidelines describe how the new Mary E. Courtenay Language Arts Center website should look and behave. They are based on research into well-regarded US school and district websites (see [Sources](#18-sources)) and on a review of the current site at courtenay.cps.edu. Anyone building a page or component should be able to work from this document without further input.

**Design intent in one sentence:** a proud navy-and-gold Courtenay Tigers site that gets a parent on a phone to today's answer in one tap.

**Normative language:** **must** / **must not** = required; a page that breaks it does not ship. **Should** = recommended; deviate only with a stated reason. Components reference **semantic tokens** (section 5.2), never raw hex values.

---

## 1. Intent

**Why:** Courtenay is moving off its vendor-hosted website (Educational Networks). The new site is a proof of concept now and will replace the current site later. It should be clearly better for families than the current one, and simple enough for school staff to keep current.

**Who it's for, in priority order:**
1. **Current families** — mostly on phones, often in a hurry: Is school open? What's for lunch? When is the next event? How do I reach the office?
2. **Prospective families** — deciding whether to enroll: What is this school like? How do I enroll or tour?
3. **Community** — neighbors, volunteers, LSC/PAC members: meetings, documents, how to help.
4. **Staff** — need a few links (sub requests, payroll, Aspen), but should not crowd the public experience.

**What success looks like:**
- A parent on a phone can reach any of the six everyday tasks (calendar, lunch menu, parent portal, enrollment, before/after care, contact) in one tap from the homepage.
- Nothing on the site looks stale, empty or broken (the current site shows past alerts, empty photo sections and generic placeholder images).
- The site feels unmistakably like *Courtenay* — navy, gold, tigers — not like a district template.
- Passes WCAG 2.2 AA.

### Goals
- A proud, confident school identity built from the existing shield logo.
- Families' everyday tasks first; the school's story second.
- Phone-first layouts that scale up to desktop.
- A small set of components that cover every page, so staff-edited content always looks right.
- English first (POC); Spanish added in a later phase without redesign. Everything is built Spanish-ready now (see section 14).

### Non-goals
- Logged-in areas, portals or student data (we link out to Aspen and CPS systems).
- A new logo or rebrand. We use the existing shield.
- Live social-media feeds, carousels or animated tickers.
- Dark mode (possible later; not needed for the POC).

### Anti-goals (a failure even if it technically works)
- **Looks like a high-school athletics site.** Direction B is bold; it must still feel like a place for 4- to 14-year-olds. Warmth comes from photos of young kids and plain, kind wording.
- **Recreates vendor clutter** — stacked utility bars, seven menus, staff links in public navigation.
- **Stock photography** of children who aren't Courtenay students.
- **Stale or empty content is visible** — an expired alert, an empty "Photos" heading, an event list of past dates.
- **Gold text on white** or any other low-contrast pairing.

---

## 2. Approaches considered

Three directions were mocked up side by side, all using the logo's navy and gold:

| | Direction | Trade-off |
|---|---|---|
| A | **Friendly and rounded**: pill buttons, round icon chips, soft rounded type (Kearney Public Schools style) | Very approachable; risks looking childish or template-like |
| **B** | **Bold school spirit**: full-bleed photos, condensed uppercase headlines, solid gold and navy blocks, tiger-stripe bands (Warwick Valley CSD style) | Confident, proud, distinctive; risks feeling like a high-school sports site |
| C | **Warm literary**: serif headlines, warm paper background, gold used only as highlighter (Whitby / Town School style) | Calm and differentiated; risks feeling formal, like a private school |

**Chosen: B — bold school spirit.** The guidelines below counter its main risk (see Anti-goals) with candid photos of young children, sentence-case body copy and restraint in how often the loudest elements appear.

---

## 3. Design principles

1. **Tasks before story.** The first screen answers "is anything happening today?" and offers the six everyday tasks. The school's story comes after.
2. **Proud, not loud.** Navy and gold carry the identity. Use the loudest moves (full-bleed photo, gold band, stripe motif) once per page each.
3. **Our kids, our building.** Every photo is of Courtenay. If we don't have one yet, use a labeled placeholder — never stock.
4. **Always current.** Every component must look intentional when it has no content (it hides) and must never show expired content.
5. **Accessible by default.** Contrast, tap size, keyboard and screen readers are built into the components, not checked at the end.

---

## 4. Brand

### Name
| Use | Name |
|---|---|
| Official / footer / page titles | Mary E. Courtenay Language Arts Center |
| Header wordmark (two lines) | **COURTENAY TIGERS** / Language Arts Center · Pre-K–8 |
| Running text | Courtenay |

Confirmed: the official name is **Mary E. Courtenay Language Arts Center**. ("Courtenay Elementary School" in `site.json` is outdated.) In Spanish the official name stays as is; the descriptor line becomes "Language Arts Center · Pre-K a 8.º grado".

### Logo
- Use the existing shield (navy shield, gold tiger stripes, navy "C"). The school will provide the vector file later; until then the POC uses the 118×128 PNG from the current site, shown no larger than 48px tall so it stays sharp.
- Minimum size: 32px tall on screen. Clear space: at least ¼ of the shield's width on every side.
- On navy backgrounds the shield sits directly on navy (it has its own gold edge). Never place it on gold or on a photo.
- Don't recolor, stretch, outline or add shadows. The old site's embossed grey "Mary E. Courtenay" wordmark image is retired; the name is always live text.

### Mascot
"Tigers" is used for spirit moments: the header wordmark, section names like "Tiger News", and celebration content. No cartoon tiger illustrations unless the school provides an official one.

---

## 5. Color

Taken from the logo. Contrast ratios are verified against WCAG 2.2.

### 5.1 Base palette (primitives — components must not use these directly)

| Token | Hex | Role |
|---|---|---|
| `--navy` | `#1B2A6B` | Primary brand: header, headings, secondary buttons, icons |
| `--navy-deep` | `#111C4A` | Alert bar, footer, text on gold, photo overlays |
| `--gold` | `#F6CE1F` | Primary buttons, pride band, accent bars, focus ring on navy |
| `--gold-text` | `#7A6200` | The only "gold" allowed as text on light backgrounds (dates, small labels) |
| `--ink` | `#121733` | Body text |
| `--muted` | `#4A5068` | Secondary text, captions in lists, metadata |
| `--surface` | `#F4F5F8` | Alternate section background |
| `--line` | `#E1E4EC` | Dividers and card borders (decorative only) |
| `--white` | `#FFFFFF` | Page background |
| `--alert-red` | `#B42318` | Emergency alerts only |

### 5.2 Semantic tokens (what components use)

| Semantic token | Maps to |
|---|---|
| `color.text.primary` | `--ink` |
| `color.text.secondary` | `--muted` |
| `color.text.brand` | `--navy` |
| `color.text.accent` (on light) | `--gold-text` |
| `color.text.on-dark` | `--white` |
| `color.text.accent-on-dark` | `--gold` |
| `color.text.on-accent` | `--navy-deep` |
| `color.surface.page` | `--white` |
| `color.surface.alt` | `--surface` |
| `color.surface.brand` | `--navy` |
| `color.surface.brand-strong` | `--navy-deep` |
| `color.surface.accent` | `--gold` |
| `color.border.subtle` | `--line` |
| `color.border.control` | `--muted` |
| `color.action.primary.bg` / `.fg` | `--gold` / `--navy-deep` |
| `color.action.secondary.bg` / `.fg` | `--navy-deep` / `--white` |
| `color.focus.on-light` / `.on-dark` | `--navy` / `--gold` |
| `color.status.emergency.bg` / `.fg` | `--alert-red` / `--white` |
| `color.status.error.fg` | `--alert-red` |

### 5.3 Approved pairings
| Text / foreground | Background | Ratio | Allowed for |
|---|---|---|---|
| ink | white | 17.6:1 | all text |
| muted | white / surface | 8.0 / 7.3:1 | all text |
| navy | white / surface | 13.2 / 12.1:1 | all text |
| white | navy / navy-deep | 13.2 / 16.3:1 | all text |
| gold | navy / navy-deep | 8.7 / 10.7:1 | all text |
| navy-deep | gold | 10.7:1 | all text |
| gold-text | white / surface | 5.9 / 5.4:1 | all text |
| white | alert-red | 6.6:1 | all text |

### 5.4 Rules
- Text and icons **must** use only the pairings in 5.3.
- `--gold` **must not** be used as text or icons on white or surface (1.5:1 — fails).
- `--line` is decorative only; it **must not** be the sole boundary of an input or button (controls use `color.border.control`, 7.9:1).
- Color **must not** be the only signal: alerts carry a label word ("Closed", "Emergency"); links in body text are underlined.
- Page backgrounds **should** alternate `color.surface.page` and `color.surface.alt` between sections; a page **must** have at most one navy section and one gold band (plus header and footer).

---

## 6. Typography

| Role | Typeface | Notes |
|---|---|---|
| Display and headings | **Oswald** 500 / 700 (Google Fonts) | Condensed; carries the "spirit" voice |
| Body, UI, buttons below 16px | **Barlow** 400 / 500 / 600 (Google Fonts) | Clear and slightly sporty; pairs with Oswald |

Load only the weights listed, with `font-display: swap`, self-hosted or via Google Fonts.

### Scale (mobile → desktop)
| Token | Mobile | Desktop | Font | Case |
|---|---|---|---|---|
| Display (homepage hero only) | 40px / 1.0 | 72px / 0.95 | Oswald 700 | UPPERCASE |
| H1 (page title) | 34px / 1.05 | 52px / 1.0 | Oswald 700 | UPPERCASE |
| H2 (section) | 26px / 1.1 | 36px / 1.1 | Oswald 700 | UPPERCASE |
| H3 (card / sub-section) | 19px / 1.25 | 22px / 1.25 | Barlow 600 | Sentence case |
| Body | 17px / 1.6 | 18px / 1.6 | Barlow 400 | Sentence case |
| Small / meta | 14px / 1.45 | 14px / 1.45 | Barlow 500 | Sentence case |
| Label / eyebrow / button | 14–16px | 16px | Oswald 500, +0.04em tracking | UPPERCASE |

Type tokens: `font.family.display` = Oswald, `font.family.body` = Barlow, `font.size.display|h1|h2|h3|body|small|label` as above. Components **must** use these tokens; no one-off sizes.

### Rules
- UPPERCASE **must** be used only with Oswald (display, H1, H2, labels, buttons) and only when the text is 8 words or fewer. Longer headings switch to sentence case automatically.
- Body text, news titles and anything staff write at length **must not** be uppercase.
- Body text **must not** be below 16px; reading line length **should** be 60–75 characters (max-width ~680px).
- Each page **must** have one H1; headings **must** go down one level at a time.
- Gold emphasis: one phrase in the display headline may be `--gold` (on navy/photo overlays only), e.g. "Curious minds. **Kind hearts.**"

---

## 7. Layout and spacing

- **Phone first.** Design at 390px, then 768, 1024, 1440. No horizontal scroll at 320px.
- **Container:** max-width 1200px, side gutters 16px (mobile) / 24px (tablet) / 32px (desktop). Every section's content aligns to the same left and right edges.
- **Grid:** 4 columns mobile, 8 tablet, 12 desktop; gap 16 / 24px.
- **Spacing tokens:** `space.1`=4, `space.2`=8, `space.3`=12, `space.4`=16, `space.5`=24, `space.6`=32, `space.7`=48, `space.8`=64, `space.9`=96 (px). Section padding: `space.7` mobile, `space.8`–`space.9` desktop. Components **must not** use spacing values outside this scale.
- **Radius tokens:** `radius.none`=0 (bands, buttons, full-bleed media), `radius.sm`=4px (cards, inputs, date blocks). No pills or large rounded corners — that belongs to direction A.
- **Shadow tokens:** flat by default. `shadow.header`=`0 2px 8px rgba(17,28,74,.18)`, used only on the sticky header once scrolled.
- **Z-index tokens:** content 0, sticky header 20, mobile menu 30, skip link 50.

---

## 8. Graphic motif: tiger stripes

Drawn from the stripes on the shield.

- A diagonal stripe pattern (about −55°), navy-deep at ~10% opacity on gold, or gold at ~15% on navy.
- Used **once per page**, on a band (the pride band on the homepage, the page-title band on inner pages, or the footer top edge).
- Never behind body text or small text; never on photos.
- A 6px solid gold bar is the everyday accent: left of section H2s, under the alert bar, and as the active-nav indicator.

---

## 9. Photography and imagery

- **Real Courtenay photos only**: candid, kids doing things (reading, building, playing, performing), teachers with students, the building and Uptown neighborhood. Bright, natural light; faces visible and in focus.
- **Young kids lead.** At least half of homepage photos show Pre-K to grade 3, to keep direction B from reading as a high school.
- **Consent:** only students with a media release on file. (Design requirement; the process is the school's.)
- **Aspect ratios:** hero 16:9 desktop / 4:5 mobile crop; cards 3:2; staff headshots 1:1.
- **Text over photos:** only with a navy-deep gradient overlay (transparent → 90% from the middle down) so the text passes 4.5:1 regardless of the photo.
- **POC placeholders:** a neutral striped box with a short label of the intended shot (e.g. "Kids at recess"). Never stock photos, never the vendor's `news-default.jpg` style fallback. A news item without a photo uses the text-only card variant.
- **Alt text** describes what's happening ("Second graders reading together in the library"); decorative images use `alt=""`.
- Serve WebP/AVIF with `srcset`, lazy-load below the first screen, always set width/height to avoid layout shift.

### Icons
- **Lucide** outline icons, 24px, 2px stroke, `--navy` on light / `--gold` on navy. One set only.
- No emoji as icons. Icon-only controls always have an accessible name.

---

## 10. Components

### 10.0 Rules for every component

**State contract.** Every interactive element **must** define these states. "n/a" means the state cannot occur on this static site and is intentionally not designed.

| Element | Default | Hover (pointer) | Focus-visible (keyboard) | Active (press/touch) | Disabled | Loading | Error |
|---|---|---|---|---|---|---|---|
| Primary button | gold bg, navy-deep text | bg darkens ~8% | 3px navy ring, 2px offset | moves down 1px | n/a — hide the action instead | n/a | n/a |
| Secondary button | navy-deep bg (light) / gold outline (dark) | gold 2px bottom border | 3px gold ring on dark, navy on light | moves down 1px | n/a | n/a | n/a |
| Text link | navy, underlined | underline thickens to 2px | focus ring | color → navy-deep | n/a | n/a | n/a |
| Quick-task tile | white, navy icon + label | surface bg + gold bottom bar | focus ring around tile | surface bg | n/a | n/a | n/a |
| Nav item | white Oswald on navy | gold underline grows in | gold ring | gold text | n/a | n/a | n/a |
| Linked card | white/surface | photo zooms 1.03, title underlines | ring around whole card | as hover | n/a | n/a | n/a |
| Menu button | "Menu" + icon | gold text | gold ring | — | n/a | n/a | n/a |
| Search field | white, muted 1px border | border navy | 3px navy ring | — | n/a | spinner in the button while results load | message under field, red border + icon |
| Form field (contact) | as search | as search | as search | — | grey bg, 60% text, not focusable | button shows spinner, disabled | red border + icon + message under the field naming the fix |

**Input methods.** All behavior **must** work by keyboard (Tab/Shift-Tab, Enter/Space on buttons, Esc closes menus), pointer and touch. Nothing **must** depend on hover alone: dropdowns open on click/tap and on Enter, not only on hover.

**Content edge cases.** Every component **must** handle:
- **Empty:** the whole component hides, including its heading. No empty headings, no "No items" filler unless specified below.
- **Long content:** titles wrap (never truncate mid-word on mobile); card titles clamp at 3 lines with an ellipsis and the full title in the link's accessible name; long words break (`overflow-wrap: anywhere`) so nothing causes horizontal scroll.
- **Missing image:** use the text-only variant of the component, never a generic fallback image.
- **Translation growth:** Spanish runs ~25% longer — labels and buttons **must** still fit at 320px.

### 10.1 Alert banner
Top of every page, above the header, full width.

| Level | Style | Example |
|---|---|---|
| Info | navy-deep bar, white text, gold label "NOTICE", 4px gold bottom border | Report card pick-up Thursday |
| Closure | navy-deep bar, gold label "CLOSED" | No school Monday: staff development day |
| Emergency | alert-red bar, white text, white label "EMERGENCY" | Early dismissal at 12:00 today |

- One alert at a time; one or two lines; optional "Details" link.
- Must have an **end date**; it disappears automatically after it. A banner with past dates must never show.
- Not dismissible for Emergency; Info and Closure may be dismissed per visit.
- No scrolling ticker.

### 10.2 Header and navigation
- **Navy bar**, sticky on scroll. Left: shield + two-line wordmark (COURTENAY TIGERS / Language Arts Center · Pre-K–8). Right: **language switch**, search icon, and **Menu** button (mobile) or the nav (desktop ≥ 1024px).
- **Language switch** (phase 2 — appears only once Spanish pages exist; never a dead link): shows the *other* language in that language — "Español" on English pages, "English" on Spanish pages (`lang` set on the link). It goes to the **same page** in the other language, never back to the homepage. It is visible in the header at every width (not hidden in the menu), Barlow 600, gold text, ≥ 44px tap area.
- **Top-level navigation — five items, by audience/task:**
  1. **About** — mission & values, our staff, tours, LSC & PAC
  2. **Families** — calendar, lunch menu, parent portal, before/after care, payments, preschool, kindergarten readiness, athletics
  3. **Enroll** — how to enroll, tours, preschool enrollment
  4. **News & Events**
  5. **Contact** — contact, directions, staff directory
- **Staff links** (Frontline, Kronos, Aspen staff) move to a "Staff" link in the footer. Volunteer moves under About.
- Desktop: Oswald 500 uppercase, 16px, white; active item has a 4px gold underline. Dropdowns are simple lists (no mega-menu needed at this size).
- Mobile: full-screen navy menu, items 20px, each row ≥ 48px tall, with the six quick tasks repeated at the bottom. The Menu button announces its open/closed state.
- External links (Aspen, CPS calendar, meal menu) show a small "opens CPS site" icon and open in the same tab.

### 10.3 Hero (homepage)
- Full-bleed photo, navy-deep gradient overlay on the lower half, display headline over it (one gold phrase allowed), one-line supporting sentence.
- Directly below the photo: **button pair** spanning the full width on mobile — gold "ENROLL NOW", navy-deep "BOOK A TOUR".
- Height: ~70% of the viewport on mobile; ≤ 640px on desktop so the quick tasks peek in on a laptop screen.
- No carousel, no autoplay video. (A short muted loop with a pause button may be considered later, if the school provides footage.)

### 10.4 Inner page header
- Navy band with the stripe motif (if not used elsewhere on the page), H1 in white, optional one-line intro in white, breadcrumb above in gold small caps.

### 10.5 Buttons
| Variant | Style | Use |
|---|---|---|
| Primary | `--gold` fill, `--navy-deep` text, Oswald 500 uppercase 16px, square corners | One per screen: the main action |
| Secondary | `--navy-deep` fill (on light) or 2px gold outline (on navy), white/gold text | The second action |
| Text link | `--navy`, underlined, 600 weight | Inline and "See all" links |

- Minimum 48px tall, padding 14px 24px; full width on mobile when in a pair.
- Labels are a verb + object: "Enroll now", "Book a tour", "See all news". Never "Click here" or "Learn more" alone.
- Hover: background darkens ~8% and a 2px gold underline/border appears on secondary; press: shifts down 1px. Focus: 3px gold ring offset 2px (navy ring on gold buttons).

### 10.6 Quick tasks
- A grid of exactly **six** tasks: Calendar · Lunch menu · Parent portal · Enroll · Before & after care · Contact. (When Spanish launches, "Español" replaces Before & after care, which moves into the Families menu.)
- 3 columns on mobile, 6 in one row on desktop. Each tile: Lucide icon (navy) above an Oswald uppercase label, separated by 1px `--line` dividers, white background.
- Whole tile is the tap target (≥ 88px tall on mobile). Hover: background `--surface` and gold bottom bar.
- Placed directly after the hero on the homepage and repeated at the bottom of the mobile menu.

### 10.7 Pride band
- Gold band with the stripe motif; three facts in Oswald 700 (32–48px) with a small uppercase label below.
- Facts **must** be real and come from the school (e.g. enrollment, grades served, a program fact). No invented numbers.
- **POC placeholders:** three slots, each with a placeholder value and label: `000` / STUDENTS · `PRE-K–8` / GRADES (this one is real) · `00:1` / STUDENT–TEACHER RATIO. The labels are editable too, so the school can swap in different facts. Placeholder values must be easy to spot in review and must be replaced before launch.
- Numbers do not count up; they're static.

### 10.8 News
- **Card (with photo):** 3:2 photo, date in Oswald 500 uppercase `--gold-text`, title in Barlow 600, optional one-line excerpt. Whole card is the link.
- **Card (text only):** same without the photo, with a 6px gold left bar. Used when a post has no photo.
- Homepage shows the 3 latest posts and a "See all news" link. Mobile: stacked list with 120px thumbnails on the left; desktop: 3 columns.
- Section title: "TIGER NEWS" with the gold bar.
- **News page:** all posts as cards, newest first, 12 per page, same layout.
- **News post page:** inner page header (10.4) with the title in sentence case and the date, optional photo at full reading-column width, then the story (10.10). Ends with "← All news" and the next two headlines.

### 10.9 Events
- A date-block list: square navy block with month (gold, small) and day (white, large), then the event name, time and place.
- Homepage shows the next 4 upcoming events only; past events are never shown. Link: "See full calendar".
- If there are no upcoming events, show one line: "No events scheduled — see the CPS calendar for district dates."

### 10.10 Content page body
- White background, reading column max ~680px, standard heading styles.
- Supports: headings, paragraphs, lists, links, images (full column width), PDF/document links (with file type and size: "LSC minutes, Oct 2026 (PDF, 220 KB)"), and a callout box (surface background, gold left bar) for key info like deadlines.

### 10.11 Staff directory
- Grid of cards: 1:1 photo (or navy circle with initials when missing), name, role, email link. Filter by group (Administration, Pre-K, K–2, 3–5, 6–8, Specials, Support).

### 10.12 Footer
- `--navy-deep` background with a stripe edge or gold top bar (whichever the page's motif budget allows).
- Columns: school name + shield, address with "Get directions", phone, fax, office hours · Quick tasks · About/Families/Enroll links · CPS logo, Non-discrimination statement, Mental health resources, Staff links.
- Social: **Instagram only** — [instagram.com/courtenaytigers](https://www.instagram.com/courtenaytigers/), shown as the Instagram icon with the accessible name "Courtenay on Instagram". The current site's Facebook link (goes to facebook.com, not the school) and X link are dropped. Add other accounts only when they are active and school-specific.
- Contact details (phone, address, hours) **must** appear in the same place on every page (WCAG 2.2 consistent help).

### 10.13 Search
- Opened from the search icon in the header; on mobile it opens as a full-width field under the header; on desktop it expands inline.
- Visible label ("Search Courtenay"), field + navy "Search" button, results page uses the news-card list pattern.
- States per 10.0. No-results message: "No results for '…'. Try the Families page or call the office."

### 10.14 Form fields (for later contact/tour forms)
- Label above the field (Barlow 600, 16px), always visible — never placeholder-as-label.
- Field: 48px tall, 1px `color.border.control`, `radius.sm`, 16px text (prevents mobile zoom).
- Required fields marked "(required)" in text, not only with an asterisk.
- Errors appear under the field on submit and on leaving a filled field, in `color.status.error.fg` with an icon; focus moves to the first error.
- Don't ask families to retype information already given in the same form (WCAG 2.2 redundant entry).

---

## 11. Homepage blueprint

Order on every screen size:

```
┌───────────────────────────────┐
│ ALERT BAR (only when active)  │
├───────────────────────────────┤
│ [shield] COURTENAY TIGERS  [⌕][≡]│ navy, sticky; search + menu (ES in phase 2)
├───────────────────────────────┤
│                               │
│   full-bleed photo            │
│   CURIOUS MINDS.              │
│   KIND HEARTS.  (gold)        │
├───────────────┬───────────────┤
│  ENROLL NOW   │  BOOK A TOUR  │  gold / navy-deep
├─────────┬─────┴───┬───────────┤
│Calendar │ Lunch   │ Portal    │  quick tasks
│Enroll   │ Care    │ Contact   │
├─────────┴─────────┴───────────┤
│ 000  ·  PRE-K–8  ·  00:1       │  gold pride band + stripes
├───────────────────────────────┤
│ ▌TIGER NEWS        See all →  │  3 latest, as cards
├───────────────────────────────┤
│ ▌UPCOMING EVENTS   Calendar → │  next 4
├───────────────────────────────┤
│ Principal's welcome (short,   │  surface bg, photo of principal
│ link to full message)         │
├───────────────────────────────┤
│ FOOTER                        │  navy-deep
└───────────────────────────────┘
```

Optional later: a "Life at Courtenay" photo grid (6 real photos) between Events and the welcome, once photos exist. It must not appear empty.

---

## 12. Motion

Restrained and purposeful. All motion **must** respect `prefers-reduced-motion` (everything rests; nothing stays hidden).

Motion tokens: `motion.duration.fast`=150ms, `motion.duration.base`=200ms, `motion.duration.enter`=400ms; `motion.easing.out`=`cubic-bezier(.2,.8,.2,1)`. Only `transform`, `opacity`, `color` and `background-color` animate.

- Hover and focus transitions: 150–200ms, ease-out, color/background/underline only.
- Linked cards: photo zooms to 1.03 inside its frame on hover; no lift shadows.
- Mobile menu: slides/fades in over 200ms.
- Hero: the headline and buttons fade up once on page load (≤ 400ms). Nothing else animates on load.
- **Not allowed:** fade-in-on-scroll for sections or cards, parallax, carousels, auto-advancing anything, count-up numbers, scrolling tickers.

---

## 13. Accessibility (WCAG 2.2 AA)

Each requirement is written so it can be tested.

| # | Requirement (must) | How to test |
|---|---|---|
| A1 | Text contrast ≥ 4.5:1 (≥ 3:1 for text ≥ 24px or ≥ 19px bold); only pairings in 5.3 | axe / contrast checker on every template |
| A2 | Text over photos only with the navy-deep overlay | Visual check with the brightest test photo |
| A3 | Non-text contrast ≥ 3:1 for control borders, focus rings and icons that convey meaning | Contrast checker |
| A4 | Tap targets ≥ 44×44px (48px for buttons, nav rows, quick tasks); ≥ 8px between adjacent targets | Measure at 390px in dev tools |
| A5 | Every interactive element shows a visible focus ring (3px, 2px offset) | Tab through each template |
| A6 | A focused element is never hidden behind the sticky header (`scroll-padding-top` ≥ header height) | Tab through a long page; each focus is fully visible (WCAG 2.4.11) |
| A7 | "Skip to main content" is the first Tab stop and moves focus to `main` | Press Tab once on page load |
| A8 | Focus order matches visual order; no `tabindex` > 0 | Tab through each template |
| A9 | Landmarks `header`, `nav`, `main`, `footer`; one H1; no skipped heading levels | axe; headings list in a screen reader |
| A10 | Menu button exposes `aria-expanded`; Esc closes the menu and returns focus to the button | Keyboard + VoiceOver |
| A11 | Every image has `alt` (descriptive, or empty if decorative); icon-only controls have accessible names | axe |
| A12 | `lang="en"` on the page; Spanish content and the "Español" link marked `lang="es"` | Inspect markup |
| A13 | Links to files state type and size; key info (enrollment, calendar) exists as HTML, not only PDF/image | Content review |
| A14 | Nothing conveyed by color alone; no images of text | Grayscale screenshot review |
| A15 | Content reflows at 320px with no horizontal scroll; usable at 200% zoom | Resize to 320px; browser zoom 200% |
| A16 | Under `prefers-reduced-motion`, nothing animates and nothing stays hidden | Toggle OS setting |
| A17 | Contact help appears in the same place on every page | Compare templates (WCAG 3.2.6) |
| A18 | Lighthouse accessibility ≥ 95; zero axe violations | Run on every template |

---

## 14. Content voice (design-facing)

- Plain language, short sentences, around a 6th-grade reading level; families' first languages vary.
- Sentence case everywhere except Oswald display/labels.
- Dates: "Monday, Nov 16" in lists; "November 16, 2026" in posts. Times: "8:00 am".
- Headings name the thing ("Lunch menu", not "Nourishing young minds").
### Spanish (phase 2)
The POC ships in **English only**. Spanish follows in a later phase, written and reviewed by bilingual office staff. To add it without redesign, the English build **must** already be Spanish-ready:
- All interface text (buttons, nav, quick tasks, alert labels, empty states, date formats) lives in one strings file, not hard-coded in templates.
- Layouts **must** survive ~25% longer text at 320px — test with the sample Spanish labels below.
- No language switch, "Español" link or translate widget is shown until Spanish pages exist.

When Spanish launches, at minimum the homepage, Enroll, Families, News & Events (including alerts) and Contact **must** have Spanish versions.
- Spanish pages use the same layout and components; only text changes. All UI labels (buttons, quick tasks, nav, alert labels, dates, empty-state messages) have Spanish versions — e.g. "INSCRIBIR AHORA", "AGENDAR UNA VISITA", "Menú del almuerzo", alert labels "AVISO" / "CERRADO" / "EMERGENCIA".
- Dates in Spanish: "lunes, 16 de nov." in lists; "16 de noviembre de 2026" in posts. Months and weekdays lowercase.
- Uppercase rules apply the same way and must keep accents (INSCRIPCIÓN, not INSCRIPCION).
- Designs **must** be checked with Spanish text at 320px (about 25% longer).
- On Spanish pages the "Español" quick task becomes "English".
- Translation is done by bilingual staff (decided 2026-11-13); machine translation may assist drafts later.

| Instead of | Write |
|---|---|
| "Click here to learn more" | "See the lunch menu" |
| "IMPORTANT ANNOUNCEMENT!!!" | Closure alert: "No school Monday, Nov 16: staff development day" |
| "Our Commitment to Excellence in Nutrition" | "Lunch menu" |
| "Parents may avail themselves of the enrollment process" | "Enroll your child in four steps" |

---

## 15. Anti-patterns (must not ship)

| Anti-pattern | Why | Instead |
|---|---|---|
| Scrolling news ticker | Hard to read, can't be paused, goes stale | One alert banner with an end date |
| Hero carousel / auto-advancing slides | Hides content, fails motion and focus rules | One hero photo |
| Stacked utility bar above the nav (login, create account, translate, search, social) | Clutter before content | Search (and later Español) in the header; no public login |
| Staff/payroll links in public nav | Wrong audience | Footer "Staff" link |
| Generic fallback image on news posts | Looks broken and repetitive | Text-only card variant |
| Empty section heading ("School Photos" with nothing) | Looks abandoned | Component hides when empty |
| Expired alerts or past events | Erodes trust | End dates; past events filtered out |
| Text set as an image (embossed wordmark) | Inaccessible, blurry | Live text |
| Fade-in on scroll, parallax, count-up numbers | Distracting, accessibility risk | Static content; one hero entrance |
| Stock photos of children | Not our community | Labeled placeholders until real photos |
| Gold text on white; pill buttons; drop shadows on cards | Off-system | Tokens and pairings in sections 5–7 |

---

## 16. Migration notes from the current site (design only)

**Navigation mapping**

| Current (7 groups) | New |
|---|---|
| Home | Shield/wordmark link |
| About Us → News & Announcements | News & Events |
| About Us → Vision/Mission, School Tours, LSC | About (tours also under Enroll) |
| Students → After School, CPS Digital Resources | Families → Before/after care; Families → Learning resources |
| Parents (8 links) | Families; "How to Enroll", "Preschool", "Kindergarten readiness" → Enroll |
| Staff (Frontline, intranet, Aspen, Kronos) | Footer "Staff" link |
| Volunteer | About → Volunteer |
| Contact Us (contact, directions, staff) | Contact |

**Retired:** scrolling alert ticker, header login/create-account, duplicate desktop/mobile logo markup, embossed name image, photo-album and video widgets with no content, page-view counter, vendor footer logo.

**Kept and redesigned:** alert (now one banner with end date), news cards, upcoming events, enrollment pages, tours, preschool and kindergarten readiness pages, staff directory, LSC documents, CPS non-discrimination statement and mental health resources in the footer.

---

## 17. Review checklist

Before any page ships:

- [ ] First screen shows the alert (if any), header, hero and both buttons; quick tasks within one scroll on mobile.
- [ ] Only approved color pairings; no gold text on light backgrounds.
- [ ] Uppercase only on Oswald text of 8 words or fewer.
- [ ] Stripe motif, gold band and navy section each used at most once.
- [ ] No stock photos; placeholders labeled; every image has alt text.
- [ ] No empty sections, expired alerts or past events visible.
- [ ] All targets ≥ 44px; visible focus; skip link works; Menu announces state.
- [ ] Works at 320, 390, 768, 1024, 1440 with no horizontal scroll.
- [ ] Respects reduced motion; no scroll-triggered animation.
- [ ] Every interactive element has the states in 10.0, tested with keyboard, mouse and touch.
- [ ] Long titles, missing images and sample Spanish labels checked at 320px.
- [ ] Only tokens used: no raw hex, off-scale spacing or one-off font sizes.
- [ ] Accessibility table A1–A18 passes; Lighthouse accessibility ≥ 95 and axe shows no violations.
- [ ] Nothing from the anti-pattern list (section 15).

---

## 18. Sources

Research (vendor showcases; design observations, not independent reviews):
- Finalsite — [Best School District Websites of 2025](https://www.finalsite.com/blog/p/~board/b/post/best-school-district-websites-of-the-year) (Warwick Valley CSD, Kearney PS, Plano ISD, Norfolk PS, Eagle Mountain-Saginaw ISD, Sacramento City USD, Metro Nashville)
- Finalsite — [School District Website Inspiration, July 2024](https://www.finalsite.com/blog/p/~board/b/post/school-district-website-inspiration-july-2024)
- Morweb — [Best School Websites of 2026](https://morweb.org/Post/best-school-websites)
- CyberOptik — [Best School Websites](https://www.cyberoptik.net/blog/best-school-websites/)
- School Jotter — [Elementary School Website Must-Haves for 2026](https://www.schooljotter.com/elementary-school-website-tips/)

Primary visual reference for direction B: [Warwick Valley CSD](https://www.warwickvalleyschools.com/) — use for structure and rhythm only; never copy its code, copy or imagery.

Note on `.claude/skills/design-system`: that file was extracted from Kearney Public Schools (direction A's reference). Its documentation standards (states, semantic tokens, testable accessibility, must/should) are adopted here; its raw tokens (Heebo, #003da5 blue, 100px radius) are **not** — this document wins where they conflict.

---

## 19. Decided vs. left to the builder

**Decided here:** direction B; palette and pairings; Oswald + Barlow; type scale; square shape language; stripe motif rules; five-item navigation; six quick tasks; homepage order; component list and states; motion limits; accessibility bar.

**Left to the builder:** exact breakpoint behaviors between the listed widths; dropdown vs. accordion details on mobile sub-menus; hover color steps; icon choice within Lucide; exact stripe spacing.

**Resolved (2026-11-13):** official name is Mary E. Courtenay Language Arts Center · pride band uses placeholders for now · Instagram (@courtenaytigers) is the only social account · POC is English-only; Spanish follows in phase 2, written by bilingual staff.

**Still waiting on the school:**
1. Vector logo file and any official tiger artwork (to be shared later).
2. The real pride-band facts (placeholders until then).
3. Real photos (placeholders until then).
