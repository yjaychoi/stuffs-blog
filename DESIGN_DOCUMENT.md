# Stuff of Thoughts - Detailed Design and Delivery Plan

**Domain:** `stuffs.blog`  
**Blog title (exact):** `Stuff of Thoughts`  
**Hosting:** GitHub Pages (Jekyll)  
**Email subscriptions:** Kit (newsletter/free plan)  
**Comments:** utterances (GitHub Issues-backed)  
**Repo visibility:** private repo allowed, public Pages output  
**Localization scope:** UI localization (`en`, `ko`) + optional multilingual posts (`en`/`ko`)  
**Primary visual reference:** attached screenshot (minimal, content-first, low chrome)

---

## 1) Product goals

### Primary goals

1. Publish by committing Markdown files to GitHub.
2. Keep interface minimal to bare necessities only.
3. Match screenshot style: narrow centered column, simple nav, sparse metadata, understated accents.
4. Support both desktop (PC) and mobile without layout breakage.
5. Support both light and dark mode with equal design quality.
6. Localize UI using an explicit i18n framework (`i18next`).
7. Support optional multilingual post variants without requiring every post translation.
8. Deploy automatically through CI/CD, including validated Kit email integration.

### Non-goals

1. No custom backend.
2. No heavy animations or decorative UI.
3. No dashboard widgets, side panels, carousels, or hero graphics.
4. No machine translation of post bodies at runtime.

---

## 2) Minimalist design contract (strict)

This section is mandatory and overrides stylistic ambiguity.

### Required layout shape

1. One centered main column.
2. Simple top nav row with only essential links.
3. Text-first content blocks (tags, year groups, post links).
4. Minimal accent usage (maximum two accent roles) and every accent must come from the Monokai palette subset.

### Maximum UI surface area

1. Header control set must include: `Home`, `Blog`, `RSS`, `Subscribe`, language toggle, theme toggle.
2. Desktop (`>=1024px`): show `Home`, `Blog`, `RSS`, and `Subscribe` inline. Language and theme toggles must be reachable either inline or via one compact utility button.
3. Tablet (`640-1023px`): show title (`Home`), `Blog`, and `RSS` inline; `Subscribe`, language toggle, and theme toggle may collapse into one utility button when space is limited.
4. Mobile (`420-639px`): show title (`Home`), `Blog`, `RSS`, and one utility button; utility panel contains `Subscribe`, language toggle, and theme toggle.
5. Narrow mobile (`<420px`): show title (`Home`) and one utility button; utility panel contains `Blog`, `RSS`, `Subscribe`, language toggle, and theme toggle.
6. No secondary content nav bars. The utility panel is allowed only for header controls.
7. No persistent sidebars on mobile.
8. No card-heavy grids for the post index.
9. No oversized hero section on index page.

### Forbidden elements

1. Social feed embeds.
2. Animated background effects.
3. Accent systems with more than two accent roles.
4. Any accent color outside the Monokai subset.
5. Floating action buttons.
6. Non-essential badges/chips except tags and optional small language marker.

---

## 3) Information architecture

### Routes

1. `/` and `/ko/` home/about + frequent tags + recent posts.
2. `/blog/` and `/ko/blog/` full reverse-chronological list.
3. `/blog/YYYY/MM/DD/slug/` route for posts authored with `lang: en`.
4. `/ko/blog/YYYY/MM/DD/slug/` required route pattern for posts authored with `lang: ko`.
5. `/tags/` and `/ko/tags/` tag index.
6. `/tags/<tag-slug>/` and `/ko/tags/<tag-slug>/` canonical tag-filtered pages.
7. `/subscribe/` and `/ko/subscribe/` Kit subscription page.
8. `/privacy/` and `/ko/privacy/` privacy notice page.
9. `/feed.xml` RSS feed.
10. `/404.html` not found page.

### Navigation (global)

1. `Home`
2. `Blog`
3. `RSS`
4. `Subscribe`
5. `EN/KO` toggle
6. `Light/Dark` toggle

### Future slots (reserved but hidden)

1. Header/footer social slot sized for GitHub + LinkedIn links later.
2. Layout must not shift when those links are enabled.

---

## 4) Localization and i18n architecture

## 4.1 UI localization framework (required)

1. Framework: `i18next` (client-side enhancement) + Liquid server-rendered locale fallbacks.
2. Init file: `assets/js/i18n.js`.
3. Resource files (single source of truth):
   1. `assets/i18n/en.json`
   2. `assets/i18n/ko.json`
4. Build sync step `scripts/sync_i18n_data.sh` must generate `_data/i18n.generated.json` from `assets/i18n/*.json`.
5. Templates use translation keys via `data-i18n` attributes and include server-rendered fallback text from `_data/i18n.generated.json`.
6. Non-post pages are pre-rendered for both locale route sets (`/` + `/ko/...`) so JS-disabled users get locale-correct UI copy.
7. UI translation source of truth is only `assets/i18n/*.json`; `_data/locales/*` must not define or duplicate UI copy.
8. Layout/include fallback literals are allowed only as progressive-enhancement defaults paired with `data-i18n` keys.

## 4.2 Locale resolution

1. Priority order:
   1. locale route prefix (`/ko/...` => `ko`; unprefixed => `en`)
   2. `?lang=en|ko` query param only as route-redirection hint on initial load
   3. `localStorage.stuffs_locale`
   4. browser language
   5. fallback `en`
2. Language toggle updates:
   1. stored preference
   2. current page route to its locale equivalent for non-post pages (for example `/blog/` <-> `/ko/blog/`)
   3. current page chrome text on post pages while keeping post URL stable
3. Internal links must preserve active locale prefix for non-post routes.
4. Canonical URLs must not include `?lang`.
5. Locale routes must remain shareable and crawlable.

## 4.3 Post language model (optional multilingual support)

Each post file is authored in exactly one language.

### Required front matter

```yaml
---
layout: post
title: "..."
date: 2026-02-14
lang: en # en | ko
tags: [css, javascript]
summary: "One sentence summary."
featured: false
---
```

### Optional multilingual fields

```yaml
translation_key: mysql-vector-search-edition
```

### Rules

1. `lang` is required on all posts.
2. `translation_key` is optional.
3. If multiple posts share a `translation_key`, they are translation variants.
4. If no variant exists, post is treated as single-language with no errors.
5. `translation_key` format is lowercase kebab-case (`[a-z0-9-]+`).
6. For one `translation_key`, at most one `en` post and at most one `ko` post are allowed.
7. Duplicate language variants for the same `translation_key` fail CI.
8. Permalink generation strategy (required):
   1. English posts must live under `_posts/en/`.
   2. Korean posts must live under `_posts/ko/`.
   3. `_config.yml` defaults map `_posts/en/*` to `/blog/:year/:month/:day/:title/`.
   4. `_config.yml` defaults map `_posts/ko/*` to `/ko/blog/:year/:month/:day/:title/`.
   5. Manual `permalink` overrides are forbidden by default.
   6. Exception path: manual override is allowed only with `permalink_override_reason` and explicit CI allowlist entry.
9. Language-route rules:
   1. `lang: en` must never output under `/ko/...`.
   2. `lang: ko` must always output under `/ko/blog/...`.
10. Variant permalinks must be unique; CI fails on output URL collisions.

## 4.4 Variant linking behavior

1. On post page:
   1. If exactly one variant exists in other language, show one alternate-language link.
   2. If no variant exists, show nothing.
   3. If multiple candidate variants exist, fail CI and do not deploy.
2. On index pages:
   1. Show each authored post as its own entry.
   2. Include a compact language marker (`EN` or `KO`) in metadata.
3. No automatic text translation.

---

## 5) Visual system

## 5.1 Typography and Korean coverage

### Heading/title stack

1. Latin primary: `Courier Prime` (self-hosted WOFF2).
2. Korean companion: `Noto Serif KR` (self-hosted WOFF2).
3. Fallbacks: `"Apple SD Gothic Neo"`, `"Malgun Gothic"`, `"Noto Serif CJK KR"`, `serif`.
4. For `:lang(ko)`, title headings switch to Korean-capable stack.

### Body stack

1. `"Noto Sans KR"`, `"Apple SD Gothic Neo"`, `"Malgun Gothic"`, `system-ui`, `sans-serif`.
2. Must render full Hangul coverage (no tofu).

### Font loading and performance

1. Self-hosted fonts must use `font-display: swap`.
2. Provide subset files (Latin/core + Korean) using `unicode-range` to reduce first paint cost.
3. Preload only the title font and current-locale primary body font on first view.
4. CI must enforce a first-view font budget for critical routes (target: <= `350KB` combined WOFF2 transfer before caching).

### Type scale

1. Desktop:
   1. Site title: `36-46px`
   2. Section title: `34-42px`
   3. Post title: `36-48px`
   4. Body: `17-18px`
2. Mobile:
   1. Site title: `28-34px`
   2. Section title: `26-30px`
   3. Post title: `30-36px`
   4. Body: `16-17px`

## 5.2 Theme system (light + dark required)

Both themes must preserve minimalist look and readability.

### Monokai subset palette contract (required)

1. Blog color tokens must be selected only from this Monokai subset:
   1. `#272822` (base dark)
   2. `#f8f8f2` (base light)
   3. `#75715e` (muted/comment)
   4. `#f92672` (accent pink)
   5. `#fd971f` (accent orange)
   6. `#e6db74` (yellow)
   7. `#a6e22e` (green)
   8. `#66d9ef` (cyan)
   9. `#ae81ff` (purple)
2. If alpha is needed, use transparency over one of the colors above; do not introduce new base hex colors.
3. Accent role mapping:
   1. `--accent` = primary emphasis (active nav, highlighted metadata).
   2. `--accent-alt` = secondary emphasis (CTA borders, subtle highlights).
4. Text role mapping:
   1. `--text` and `--muted-text` are the only default glyph-color tokens for body-size text.
   2. `--accent` and `--accent-alt` are decorative by default (underline, border, marker), not body-size text colors unless measured contrast is `>= 4.5:1`.
   3. `--muted-stroke` is non-text (border/divider/chrome) and may not be used as body-size text color.

### Light mode tokens

1. `--bg: #f8f8f2`
2. `--surface: #f8f8f2`
3. `--text: #272822`
4. `--muted-text: #75715e`
5. `--muted-stroke: #75715e`
6. `--border: #75715e`
7. `--accent: #f92672`
8. `--accent-alt: #fd971f`
9. `--tag-bg: #e6db74`
10. `--tag-text: #272822`

### Dark mode tokens

1. `--bg: #272822`
2. `--surface: #272822`
3. `--text: #f8f8f2`
4. `--muted-text: #ae81ff`
5. `--muted-stroke: #75715e`
6. `--border: #75715e`
7. `--accent: #f92672`
8. `--accent-alt: #fd971f`
9. `--tag-bg: #75715e`
10. `--tag-text: #f8f8f2`

### Theme behavior

1. Default follows `prefers-color-scheme`.
2. User toggle persists to `localStorage.stuffs_theme`.
3. Toggle is compact text or icon button in header.
4. No theme transition animation longer than `150ms`.

## 5.3 Minimal component styling rules

1. Links are underlined by default and use `--text` as the default link color in long-form content.
2. Tag chips are flat rectangles with subtle border/background.
3. Buttons use thin border and no heavy fills by default.
4. Shadows are either none or very subtle.
5. Rounded corners are low (`2-6px` range).
6. Use `--accent` and `--accent-alt` sparingly for nav-active states, CTA borders, and small metadata highlights.
7. For text below large-text thresholds, apply accent via underline/border/marker while keeping glyph color at `--text` or `--muted-text` unless measured contrast is `>= 4.5:1`.
8. In dark theme, `#75715e` is reserved for borders/dividers/chrome and must not be used as paragraph-scale glyph color.

## 5.4 Post code block highlighting (Monokai required)

1. Embedded code in post bodies (fenced blocks and Liquid `highlight` blocks) must render with Monokai syntax highlighting in both site themes.
2. Syntax engine: Jekyll-compatible highlighter (`rouge`) with Monokai token mapping defined in `assets/css/main.css`.
3. Required code tokens:
   1. `--code-bg: #272822`
   2. `--code-fg: #f8f8f2`
   3. `--code-comment: #75715e`
   4. `--code-keyword: #f92672`
   5. `--code-string: #e6db74`
   6. `--code-number: #ae81ff`
   7. `--code-function: #a6e22e`
   8. `--code-type: #66d9ef`
4. Code block chrome includes a compact language/filename label row and copy button, styled minimally.
5. Inline code uses a muted surface treatment and must remain visually distinct from links.
6. Any code theme that materially deviates from the required Monokai palette fails CI.

---

## 6) Layout and responsiveness (PC + mobile)

## 6.1 Breakpoints

1. Mobile: `< 640px`
2. Tablet: `640-1023px`
3. Desktop/PC: `>= 1024px`

## 6.2 Container and spacing

1. Desktop content width: `680-760px`.
2. Tablet content width: `90vw`, max `760px`.
3. Mobile content width: `92vw`.
4. Vertical rhythm uses `8px` base spacing scale.

## 6.3 Header behavior

1. Desktop:
   1. Inline nav row with title (`Home`), `Blog`, and `RSS`.
   2. `Subscribe` remains inline.
   3. Language and theme toggles may be inline or grouped into one compact utility button to preserve sparse header styling.
2. Tablet (`640-1023px`):
   1. Single-row nav with title (`Home`), `Blog`, and `RSS`.
   2. `Subscribe`, language toggle, and theme toggle may appear inline only when controls remain fully reachable.
   3. If spacing is insufficient, move those controls into a utility panel button.
3. Mobile:
   1. `420-639px`: single-row nav with title (`Home`), `Blog`, `RSS`, and one utility button.
   2. `<420px`: single-row nav with title (`Home`) and one utility button.
   3. Utility panel contains all hidden global controls in order: `Blog` (if hidden), `RSS` (if hidden), `Subscribe`, language toggle, theme toggle.
   4. Header must not introduce horizontal scrolling.
   5. Utility panel may stack controls vertically; do not force inline compression.

## 6.4 Content behavior

1. Post list remains one-column on all breakpoints.
2. Code blocks scroll horizontally on mobile.
3. Touch targets minimum `44px` height for tappable controls.
4. Font sizes never below `16px` body on mobile.

---

## 7) Page-level component specs

## 7.1 Home (`/`)

### Required blocks (top to bottom)

1. Minimal nav/header.
2. Frequent tags block.
3. Year-grouped recent post list.

### Frequent tags algorithm (deterministic)

1. Compute at build time from published posts only (exclude drafts/future posts).
2. Rolling window: last `365` days anchored to build date in UTC (`site.time`).
3. CI snapshot tests must set `SITE_BUILD_DATE_UTC` to freeze the anchor date for deterministic assertions.
4. Tag count rule: one count per tag per post.
5. Sort order:
   1. count descending
   2. tag name ascending (tie-break)
6. Render top `20` tags with counts.
7. Hide tags with count `< 2`.
8. `View all` must link to locale-equivalent tags index (`/tags/` or `/ko/tags/`).
9. Implementation must be static-safe (Liquid/build script), no runtime API calls.

### Optional blocks

1. One short about paragraph.
2. One compact subscribe CTA link.

### Must not include

1. Hero image.
2. Multi-column cards.
3. Sticky sidebars.

## 7.2 Blog index (`/blog/`)

1. Reverse-chronological list grouped by year.
2. Per item:
   1. localized date in `<time datetime="...">` (visible format: `en => MMM d, yyyy`, `ko => yyyy.MM.dd`; machine value: ISO-8601)
   2. title link
   3. tags
   4. language marker

## 7.3 Post detail

1. Meta line: localized date (`en => MMM d, yyyy`, `ko => yyyy.MM.dd`), reading time (optional override), language marker.
2. Title.
3. Optional alternate-language link (if `translation_key` variant exists).
4. Body content.
5. Code blocks with copy action and Monokai syntax highlighting.
6. Prev/next links are constrained to the current post language (`en` links only to `en`, `ko` only to `ko`).
7. utterances comments.
8. Small subscribe CTA.

## 7.4 Tags page

1. Frequent tags list at top.
2. Alphabetical full list below.
3. Clicking tag must navigate to canonical tag route pages (`/tags/<tag-slug>/` or `/ko/tags/<tag-slug>/`), not ad-hoc anchors.

## 7.5 Subscribe page

1. Short value proposition.
2. Kit embed form.
3. Privacy line (`unsubscribe anytime`).
4. Minimal confirmation/success messaging.

## 7.6 Privacy page

1. Explains data processing for Kit form submissions and utterances comments.
2. Lists third-party processors and links to their privacy policies.
3. Provides contact channel for privacy-related requests.
4. Keeps copy concise and available in both locale routes (`/privacy/`, `/ko/privacy/`).

---

## 8) Accessibility and legibility

1. Meet WCAG AA contrast in both light and dark modes.
2. Focus ring always visible and keyboard navigable.
3. Respect `prefers-reduced-motion`.
4. Non-post pages set `html[lang]` from route locale (`/` => `en`, `/ko/...` => `ko`) and remain readable with JS disabled.
5. Post pages set `html[lang]` from post front matter (`lang`); locale toggle must not relabel post body language.
6. On post pages, locale-toggled chrome UI elements use element-level `lang` attributes so mixed-language UI remains semantically correct.
7. Korean paragraph wrapping uses `word-break: keep-all` plus `overflow-wrap: anywhere` fallback for URLs and long Latin tokens.
8. Every icon-only control has an accessible label.
9. Dates must be semantically marked with `<time datetime="...">` and visually localized by active UI locale.

---

## 9) SEO and metadata

1. Canonical base URL: `https://stuffs.blog`.
2. Every page emits canonical URL without query parameters (strip `?lang`).
3. OpenGraph + Twitter cards on all pages.
4. Expose RSS in header and `<head>`.
5. Generate `sitemap.xml` and `robots.txt`.
6. If translation variants exist (`translation_key`), emit `hreflang` for available languages plus `x-default` to English variant when present.
7. Each language variant is self-canonical (never canonicalize to another language variant).
8. Locale-paired non-post routes (`/`<->`/ko/`, `/blog/`<->`/ko/blog/`, `/tags/`<->`/ko/tags/`, `/subscribe/`<->`/ko/subscribe/`, `/privacy/`<->`/ko/privacy/`) must emit reciprocal `hreflang` links.
9. `_config.yml` must set `url: https://stuffs.blog` and `baseurl: ""`; repository must also include `CNAME` with `stuffs.blog`.

---

## 10) Repository structure

```text
/
  CNAME
  _config.yml
  _data/
    i18n.generated.json
  _includes/
    header.html
    footer.html
    subscribe-form.html
    language-toggle.html
    theme-toggle.html
  _layouts/
    default.html
    home.html
    blog_index.html
    post.html
    tags.html
    tag_detail.html
    subscribe.html
    privacy.html
  _posts/
    en/
    ko/
  assets/
    css/main.css
    js/i18n.js
    js/theme.js
    i18n/en.json
    i18n/ko.json
    fonts/
      CourierPrime-Regular.woff2
      NotoSerifKR-Regular.woff2
      NotoSansKR-Regular.woff2
  scripts/
    sync_i18n_data.sh
    validate_front_matter.sh
    validate_i18n_keys.sh
    validate_i18n_allowlist.sh
    validate_translation_variants.sh
    validate_permalink_strategy.sh
    validate_static_constraints.sh
    validate_code_highlighting.sh
    validate_theme_contrast.sh
    validate_seo_config.sh
    validate_kit_config.sh
  tests/
    visual/
      smoke.spec.ts
      no_js_locale.spec.ts
```

---

## 11) Deployment pipeline (required)

## 11.0 Static hosting constraints (GitHub Pages)

1. Final deploy artifact must be static files only (`HTML`, `CSS`, `JS`, assets).
2. No custom server runtime, API, or middleware is allowed.
3. Dynamic behavior is limited to client-side JS and third-party embeds (Kit form post + utterances script).

## 11.1 PR validation workflow (`.github/workflows/ci.yml`)

### Triggers

1. `pull_request` on `main`.
2. Manual `workflow_dispatch`.

### Toolchain setup (required for CI jobs)

1. Setup Ruby + Bundler cache.
2. Setup Node LTS + npm cache.
3. Install dependencies: `bundle install` and `npm ci`.

### Jobs (must pass)

1. Front matter validation:
   1. checks required fields (`title`, `date`, `lang`, `tags`, `summary`)
   2. validates `lang in {en, ko}`
   3. validates `translation_key` format when present
2. i18n source/sync validation:
   1. runs `scripts/sync_i18n_data.sh` and fails if generated `_data/i18n.generated.json` is out of sync
   2. compares `en.json` and `ko.json` key parity
   3. fails on missing keys unless explicitly allowlisted
   4. allowlist entries must include owner + issue link + expiry date; expired entries fail CI
   5. fails if `_data/locales/*` includes UI translation payloads
3. Translation/permalink validation:
   1. enforces max one `en` and one `ko` per `translation_key`
   2. enforces post path strategy (`_posts/en/*` or `_posts/ko/*`)
   3. enforces language-route rules (`lang: ko` -> `/ko/blog/...`, `lang: en` -> non-`/ko/...`)
   4. fails on duplicate output permalinks
   5. fails manual `permalink` overrides unless exception metadata + allowlist entry are present
4. Progressive-enhancement i18n validation:
   1. fails if critical nav labels are JS-only with no server-rendered fallback text
   2. fails if fallback literals in templates/includes are missing matching `data-i18n` keys
   3. fails if locale-paired non-post routes are missing server-rendered localized fallback copy
5. Static constraint validation:
   1. fails if templates introduce internal API calls or server-only dependencies
6. Build:
   1. `bundle exec jekyll build` in UTC timezone
7. HTML/link/SEO checks:
   1. no broken internal links
   2. key pages exist (`/`, `/ko/`, `/blog/`, `/ko/blog/`, `/tags/`, `/ko/tags/`, `/subscribe/`, `/ko/subscribe/`, `/privacy/`, `/ko/privacy/`, `/feed.xml`)
   3. canonical tags exclude `?lang`
   4. reciprocal `hreflang` links exist for locale-paired non-post routes
   5. RSS endpoint returns valid XML
   6. `url`, `baseurl`, and `CNAME` values are consistent with `https://stuffs.blog`
8. UI smoke tests (Playwright or equivalent):
   1. desktop viewport (`1366x900`): light/dark + `en/ko` toggles
   2. mobile viewport (`390x844`): light/dark + `en/ko` toggles
   3. asserts no horizontal overflow and header controls remain reachable (including utility-panel path)
9. No-JS localization smoke tests:
   1. JS disabled for `/ko/`, `/ko/blog/`, and `/ko/subscribe/`
   2. asserts localized fallback labels render and primary controls remain reachable
10. Accessibility audit (axe-core or equivalent):
   1. scans `/`, `/ko/`, `/blog/`, `/ko/blog/`, one `en` post page, one `ko` post page, `/subscribe/`, and `/ko/subscribe/` in light and dark themes
   2. fails on WCAG AA contrast and keyboard-focus regressions
11. Code and palette validation:
   1. fails if post code block styles/tokens deviate from required Monokai values
   2. fails if post code blocks are missing minimal chrome hooks (language/filename row + copy action)
   3. fails if blog visual tokens (`--accent`, `--accent-alt`, code tokens, and tag tokens) are outside the Monokai subset
   4. fails if text-role tokens (`--text`, `--muted-text`, `--tag-text`) violate AA contrast against theme background
12. Kit config validation:
   1. subscribe page contains Kit form include
   2. required config values are present
   3. `kit.success_url` and `kit.error_url` are absolute `https://stuffs.blog/...` URLs
   4. production gate uses `github.ref == refs/heads/main` on `push` or `workflow_dispatch`

## 11.2 Production deploy workflow (`.github/workflows/deploy.yml`)

### Trigger

1. Push to `main` after PR merge.
2. Manual `workflow_dispatch` with optional `deploy_ref` input (branch, tag, or commit SHA).

### Steps

1. Checkout.
2. Checkout `deploy_ref` when provided; otherwise checkout `main`.
3. Setup Ruby and Bundler cache.
4. Setup Node LTS and npm cache.
5. Install dependencies (`bundle install`, `npm ci`).
6. Build static Jekyll site.
7. Upload Pages artifact.
8. Deploy using GitHub Pages action.
9. Run post-deploy smoke checks with retry/backoff (`5s`, `15s`, `30s`, `60s`, `120s`):
   1. `/`, `/ko/`, `/subscribe/`, `/ko/subscribe/`, `/privacy/`, and `/feed.xml` return `200`
   2. `/feed.xml` parses as XML
   3. one desktop and one mobile smoke probe succeed
   4. one JS-disabled probe on `/ko/` succeeds

### Environment controls

1. Use protected GitHub Environment (`production`).
2. Branch protection requires CI success before merge.
3. Deployment concurrency is single-flight (`production` group) to prevent out-of-order releases.

## 11.3 Rollback

1. Preferred: run `workflow_dispatch` with `deploy_ref=<last-known-good-sha>` to redeploy an exact commit.
2. Fallback: revert merge commit in `main` and let push-triggered deploy run.
3. Record last-known-good SHA from successful deploy logs/artifacts.

---

## 12) Kit email integration setup (required)

## 12.1 One-time Kit setup

1. Create Kit account and publication.
2. Create a form dedicated to `stuffs.blog`.
3. Enable double opt-in (recommended).
4. Configure confirmation/thank-you destination page.

## 12.2 Site configuration

Add to `_config.yml`:

```yaml
kit:
  form_action: "https://app.kit.com/forms/<FORM_ID>/subscriptions"
  form_uid: "<FORM_ID>"
  success_url: "https://stuffs.blog/subscribe/?status=success"
  error_url: "https://stuffs.blog/subscribe/?status=error"
```

Only public Kit form identifiers are allowed in repo. Do not commit Kit API secrets or tokens.

## 12.3 Template integration

1. `subscribe-form.html` reads `site.kit.*`.
2. Form includes:
   1. email field
   2. submit button
   3. honeypot field (hidden)
3. Keep copy minimal and localized through shared i18n resources (`assets/i18n/*.json` + generated server fallbacks).

## 12.4 Validation gates

1. CI fails if `kit.form_action` is missing for production builds (`push` or `workflow_dispatch` on `main`).
2. CI fails if subscribe page omits the form include.
3. CI fails if form action URL is not on Kit host allowlist.
4. CI fails if `success_url` or `error_url` is not absolute `https://stuffs.blog/...`.
5. Manual QA verifies:
   1. successful subscription flow
   2. confirmation email delivery
   3. unsubscribe works

---

## 13) Comments integration (utterances)

1. Store comments in a dedicated public repo.
2. Embed only on post pages.
3. Theme must follow active site theme (light/dark variants).
4. If utterances unavailable, page content still fully readable.
5. Load utterances lazily (on explicit "Show comments" action or on viewport entry) to reduce third-party cost on first paint.
6. Show a short privacy note near comments indicating third-party GitHub Issues-backed processing.
7. On GitHub Pages, include a restrictive meta CSP and referrer policy compatible with Kit and utterances (`app.kit.com`, `utteranc.es`, `github.com`).
8. If fronted by a proxy/CDN, enforce equivalent or stricter CSP/referrer-policy headers at the edge.
9. Comments and subscribe privacy notes must link to locale-equivalent privacy page (`/privacy/` or `/ko/privacy/`).

---

## 14) Quality checklist (definition of done)

A release is done only if all items pass.

1. Header controls follow the breakpoint matrix in section 2/6, with no horizontal overflow at `1366x900`, `768x1024`, `390x844`, and `360x780`.
2. Mobile layout remains one-column and readable without overlap.
3. Light and dark themes pass automated WCAG AA checks with zero critical/serious contrast or keyboard-focus failures.
4. Text-role tokens (`--text`, `--muted-text`, `--tag-text`) pass AA contrast validation in both themes.
5. Locale route pairs render correct server fallback copy and `html[lang]` (`/`+`/ko/`, `/blog/`+`/ko/blog/`, `/tags/`+`/ko/tags/`, `/subscribe/`+`/ko/subscribe/`, `/privacy/`+`/ko/privacy/`).
6. Non-post UI remains readable with JS disabled, including `/ko/`, `/ko/blog/`, and `/ko/subscribe/`.
7. Korean text renders correctly in nav, tags, body, and buttons (no tofu).
8. Posts with and without `translation_key` both render correctly.
9. `translation_key` uniqueness and language-route rules are enforced by CI.
10. Optional alternate-language link appears only when exactly one variant exists.
11. Prev/next navigation is limited to same-language posts.
12. Subscribe form works end-to-end with Kit, including success/error redirect handling.
13. CI and deploy workflows are green; production smoke checks pass with retry/backoff.
14. Third-party embeds are lazy-loaded; privacy note and privacy page links are present.
15. Post code blocks use Monokai highlighting with copy action in both site themes.
16. Blog visual tokens and accents remain within the allowed Monokai subset.

---

## 15) Execution plan (phased)

## Phase 0 - foundation

1. Create file structure and base layouts.
2. Add typography assets, font-loading strategy (`font-display`, subset plan), and CSS token system.
3. Implement minimal header/footer shells and add `CNAME`.

## Phase 1 - core UI and responsiveness

1. Build home/blog/post/tags/subscribe layouts.
2. Implement responsive rules for mobile/tablet/desktop.
3. Add `privacy` and localized route variants (`/ko/...`) for non-post pages.
4. Match screenshot-inspired minimalist spacing and typography.

## Phase 2 - i18n and theming

1. Add `i18next` bootstrapping.
2. Replace hardcoded UI strings with keys.
3. Add `scripts/sync_i18n_data.sh` and generated `_data/i18n.generated.json` fallback pipeline.
4. Add language toggle with locale-route switching and persistence.
5. Add light/dark toggle and persistence.
6. Enforce AA-safe text token usage rules.

## Phase 3 - post language variants

1. Enforce post `lang` front matter.
2. Enforce `_posts/en` and `_posts/ko` path strategy with permalink defaults.
3. Add optional `translation_key` logic.
4. Render alternate-language link when applicable.
5. Emit `hreflang` for variant pairs.
6. Constrain prev/next navigation to same-language posts.

## Phase 4 - integrations

1. Integrate Kit form and localized labels.
2. Integrate utterances with light/dark mapping.
3. Add privacy page + privacy links for comments and subscription.
4. Verify no integration adds visual clutter.

## Phase 5 - CI/CD and launch

1. Add CI workflow checks (front matter, i18n sync/parity/fallback, permalink strategy, no-JS locale smoke, accessibility audit, build, link/SEO, Kit config).
2. Add deploy workflow to GitHub Pages with `workflow_dispatch deploy_ref` support.
3. Configure branch protection and production environment.
4. Add post-deploy smoke checks with retry/backoff and single-flight deploy concurrency.
5. Run smoke tests and publish.

---

## 16) Acceptance criteria (final)

1. Site is minimalist and conforms to the header/content constraints in sections 2 and 6.
2. Works on both PC and mobile with no broken layout or horizontal overflow in required smoke viewports.
3. Supports light mode and dark mode with persistent preference.
4. Uses `i18next` for UI localization (`en`, `ko`) with server-rendered locale fallbacks.
5. Non-post pages are locale-addressable (`/` and `/ko/...`) and readable with JS disabled.
6. Supports optional multilingual posts via `translation_key`.
7. Maintains Korean-capable font coverage in both themes.
8. Localization source of truth is only `assets/i18n/*.json`, with generated `_data/i18n.generated.json` kept in sync.
9. CI/CD deploy pipeline is active, enforced, and includes desktop/mobile smoke checks, JS-disabled locale smoke checks, and accessibility audit gates.
10. Kit email integration is configured, validated, and tested with static-safe constraints and absolute redirect URLs.
11. Comments, RSS, SEO metadata, privacy page linkage, and accessibility requirements are met.
12. Language-route permalink rules and deterministic frequent-tags computation are enforced by CI.
13. Embedded post code uses enforced Monokai highlighting and CI rejects non-Monokai theme drift.
14. Site-wide visual token palette is enforced as a Monokai subset while text-role tokens remain AA compliant.

---

If needed, next step is converting this plan into exact files and workflows (`_layouts/*`, `assets/*`, `.github/workflows/*`, and Kit form include) with concrete code.
