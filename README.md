# School website POC

Eleventy (11ty) + Markdown, hosted on GitHub Pages, edited via [Pages CMS](https://pagescms.org).

## Run locally
```
npm install
npm start
```

## Deploy
1. Push to `main` on GitHub.
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. Site appears at `https://<user>.github.io/<repo>/`.

## Let the principal edit content
1. Sign in at https://app.pagescms.org with GitHub and open this repo.
2. `.pages.yml` defines what's editable: school details & alert banner, home page message, About page, news posts, upcoming dates.
3. Saving in the CMS commits to `main`, which triggers a redeploy.

## Layout
- `src/index.md`, `src/about.md` – the two pages
- `src/news/*.md` – one file per news post (shown on home, no own page)
- `src/_data/site.json`, `calendar.json` – editable settings and dates
- `src/_includes/layouts/` – templates; `src/css/style.css` – styles
