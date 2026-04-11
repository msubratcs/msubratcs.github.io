# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog and publications site for Subrat Mishra, built with Jekyll using the al-folio theme. Deployed to https://msubratcs.github.io via GitHub Actions.

## Build & Development Commands

```bash
# Install dependencies (local path, skips production gems)
bundle config set --local path 'vendor/bundle'
bundle config set --local without 'production'
bundle install

# Local development server with auto-reload
bundle exec jekyll serve --livereload

# Build site (output to _site/)
bundle exec jekyll build

# Format Liquid/HTML/CSS files
npx prettier --write .
```

**Note:** `jekyll-minifier` and `mini_racer` are in the `production` Gemfile group (excluded locally — no JS runtime needed). ImageMagick is disabled locally; both are handled by GitHub Actions in CI.

## Architecture

### Content → Build → Deploy Pipeline

BibTeX + Markdown + Liquid templates → Jekyll + plugins → static HTML/CSS/JS → PurgeCSS (CI only) → GitHub Pages

### Key Directories

- `_pages/` — Static pages: `about.md` (homepage at `/`), `blog.md`, `publications.md`, `404.md`, `co-authorship-series.md` (series landing page)
- `_posts/` — Blog posts (format: `YYYY-MM-DD-title.md`)
- `_bibliography/papers.bib` — Publications in BibTeX format, rendered by `jekyll-scholar`
- `_layouts/` — Liquid templates (`post.liquid`, `about.liquid`, `bib.liquid`, etc.)
- `_includes/` — Reusable components; `_includes/scripts/` has modular JS includes
- `_plugins/` — Custom Ruby plugins (cache-busting, external post fetching, citation counts)
- `_sass/` — SCSS; `_variables.scss` for colors/sizing, `_themes.scss` for light/dark mode
- `_data/` — `coauthors.yml` (author name mappings), `venues.yml` (conference abbreviations)
- `assets/plotly/` — Interactive Plotly HTML visualizations embedded via `<iframe>` in blog posts

### Theme Customization

- **Theme color** is `$purple-color` in `_sass/_variables.scss` (currently set to blue `#2563eb`)
- **Light/dark mode** variables are in `_sass/_themes.scss` (`:root` for light, `html[data-theme="dark"]` for dark)
- **Favicon** is `assets/img/favicon.svg` (referenced by filename in `_config.yml` `icon:` field)
- **Social links** are configured in `_config.yml` and rendered by `_includes/social.liquid`

### Publications System

- `_bibliography/papers.bib` — BibTeX entries with custom fields (`abbr`, `selected`, `preview`, `html`, `pdf`)
- Scholar configured for APA style in `_config.yml` under `scholar:` section
- Author highlighting: matches `last_name: [Mishra]`, `first_name: [Subrat, S.]`
- Publication badges: Altmetric, Dimensions, Google Scholar (configured under `enable_publication_badges:`)

### Blog Series System

The blog supports multi-part series with a landing page pattern:

- **Series landing page**: `_pages/co-authorship-series.md` at `/blog/cf-research-network-analysis/`. Lists all parts in reading order with descriptions.
- **Series posts**: Individual posts have `series_part: true` in front matter. This hides them from the main blog listing.
- **Blog page card**: `_pages/blog.md` has a custom card section that shows series as a single entry linking to the landing page. Posts with `series_part: true` are skipped in the regular post loop.
- **Cross-linking**: Each post links to the series landing page via its subtitle, and to the next part via `{% post_url %}` at the bottom.

### Interactive Visualizations

Plotly HTML charts live in `assets/plotly/`. They are self-contained files that load Plotly from CDN. Embedded in posts via iframe:
```html
<iframe src="{{ '/assets/plotly/chart_name.html' | relative_url }}" frameborder='0' scrolling='no' height="660px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>
```
Charts use `width: 100%` and `responsive: true` so they fill the content area. Set iframe `height` to match the chart's actual height + 60px for the Plotly toolbar.

### Content Width

Site-wide max content width is set in `_config.yml` as `max_width: 1200px` (applied via `$max-content-width` in `_sass/_layout.scss`).

### Navigation

Pages appear in the navbar when their front matter has `nav: true`. Order is controlled by `nav_order:`. The homepage (`about.md`) is always first.

### Config Changes Require Server Restart

`_config.yml` changes are **not** picked up by livereload. Kill and restart `jekyll serve`.

## Deployment

Push to `main` triggers `.github/workflows/deploy.yml`:
1. Ruby 3.2.2 + bundler install (with caching)
2. `JEKYLL_ENV=production bundle exec jekyll build`
3. PurgeCSS removes unused CSS
4. Deploys to GitHub Pages

GitHub Pages source must be set to **GitHub Actions** in repo Settings → Pages.
