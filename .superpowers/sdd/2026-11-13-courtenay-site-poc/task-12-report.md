# Task 12 report
Rewrote .pages.yml (School details, Alert banner, Homepage, News, About pages, Families pages, Enroll page, Contact page, Staff) and added tests/unit/cms-config.test.js (9 tests).
RED: old .pages.yml run against new test -> failures (see below). GREEN: focused 9/9; npm test 175/175.
Notes: Pages CMS docs do not document `filter`, so `exclude` is used (news: index.njk, news.json; staff: people.json; about/families: *.json). `section` is a hidden field with default (about/families/enroll/contact). Select values use `name`/`label`. Date format yyyy-MM-dd'T'HH:mm with time: true. Old site.json alert object and calendar entry removed. Menu-only pages (permalink:false, menu_url) appear in page collections but those keys are not exposed; saving via CMS preserves unknown front matter keys (not verified against a live CMS).

## Fix note
Menu-only files excluded per controller ruling: about: staff.md; families: events.md, cps-calendar.md, parent-portal.md, lunch-menu.md. (contact/staff-directory.md is not in any collection; Contact is a single-file entry.) Added a test that every collection file with menu_url/external_url is excluded. cms-config 10/10, npm test green.
