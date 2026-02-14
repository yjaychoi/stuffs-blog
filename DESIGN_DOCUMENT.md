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
4. Minimal accent usage (single accent color for links and CTA borders).

### Maximum UI surface area

1. Header contains: `Home`, `Blog`, `RSS`, `Subscribe`, language toggle, theme toggle.
2. No secondary nav bars.
3. No persistent sidebars on mobile.
4. No card-heavy grids for the post index.
5. No oversized hero section on index page.

### Forbidden elements

1. Social feed embeds.
2. Animated background effects.
3. Multi-color accent systems.
4. Floating action buttons.
5. Non-essential badges/chips except tags and optional small language marker.

---

## 3) Information architecture

### Routes

1. `/` home/about + frequent tags + recent posts.
2. `/blog/` full reverse-chronological list.
3. `/blog/YYYY/MM/DD/slug/` post detail.
4. `/tags/` tag index.
5. `/subscribe/` Kit subscription page.
6. `/404.html` not found page.

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

1. Framework: `i18next` (client-side).
2. Init file: `assets/js/i18n.js`.
3. Resource files:
   1. `assets/i18n/en.json`
   2. `assets/i18n/ko.json`
4. Templates use translation keys via `data-i18n` attributes.
5. Visible UI strings must not be hardcoded in layouts/includes.

## 4.2 Locale resolution

1. Priority order:
   1. `?lang=en|ko` query param
   2. `localStorage.stuffs_locale`
   3. browser language
   4. fallback `en`
2. Language toggle updates:
   1. current page text
   2. stored preference
3. Locale switch must not reload to a different route.

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

## 4.4 Variant linking behavior

1. On post page:
   1. If variant exists in other language, show a single alternate-language link.
   2. If no variant, show nothing.
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

### Light mode tokens

1. `--bg: #ececec`
2. `--surface: #f6f6f3`
3. `--text: #1f1f1f`
4. `--muted: #5f5f5f`
5. `--border: #cfcfc7`
6. `--accent: #b8780a`
7. `--tag-bg: #e2e2dc`

### Dark mode tokens

1. `--bg: #272822`
2. `--surface: #2d2e2a`
3. `--text: #f8f8f2`
4. `--muted: #a1a19a`
5. `--border: #49483e`
6. `--accent: #f92672`
7. `--tag-bg: #3a3b35`

### Theme behavior

1. Default follows `prefers-color-scheme`.
2. User toggle persists to `localStorage.stuffs_theme`.
3. Toggle is compact text or icon button in header.
4. No theme transition animation longer than `150ms`.

## 5.3 Minimal component styling rules

1. Links are underlined by default.
2. Tag chips are flat rectangles with subtle border/background.
3. Buttons use thin border and no heavy fills by default.
4. Shadows are either none or very subtle.
5. Rounded corners are low (`2-6px` range).

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
   1. Inline nav row.
   2. Subscribe button aligned right.
2. Mobile:
   1. Single-row compressed nav.
   2. No multi-line overflowing nav; collapse spacing first.
   3. If needed, shorten labels (`Subscribe` -> `Sub` only on very narrow screens).

## 6.4 Content behavior

1. Post list remains one-column on all breakpoints.
2. Code blocks scroll horizontally on mobile.
3. Touch targets minimum `40px` height for tappable controls.
4. Font sizes never below `16px` body on mobile.

---

## 7) Page-level component specs

## 7.1 Home (`/`)

### Required blocks (top to bottom)

1. Minimal nav/header.
2. Frequent tags block.
3. Year-grouped recent post list.

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
   1. date
   2. title link
   3. tags
   4. language marker

## 7.3 Post detail

1. Meta line: date, reading time (optional override), language marker.
2. Title.
3. Optional alternate-language link (if `translation_key` variant exists).
4. Body content.
5. Code blocks with copy action.
6. Prev/next links.
7. utterances comments.
8. Small subscribe CTA.

## 7.4 Tags page

1. Frequent tags list at top.
2. Alphabetical full list below.
3. Clicking tag opens filtered list page/anchor section.

## 7.5 Subscribe page

1. Short value proposition.
2. Kit embed form.
3. Privacy line (`unsubscribe anytime`).
4. Minimal confirmation/success messaging.

---

## 8) Accessibility and legibility

1. Meet WCAG AA contrast in both light and dark modes.
2. Focus ring always visible and keyboard navigable.
3. Respect `prefers-reduced-motion`.
4. Set `html[lang]` based on page/post language.
5. Korean paragraph wrapping uses `word-break: keep-all`.
6. Every icon-only control has an accessible label.

---

## 9) SEO and metadata

1. Canonical base URL: `https://stuffs.blog`.
2. OpenGraph + Twitter cards on all pages.
3. Expose RSS in header and `<head>`.
4. Generate `sitemap.xml` and `robots.txt`.
5. If translation variants exist (`translation_key`), emit `hreflang` alternates for available languages.

---

## 10) Repository structure

```text
/
  _config.yml
  _data/
    locales/
      en.yml
      ko.yml
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
    subscribe.html
  _posts/
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
    validate_front_matter.sh
    validate_i18n_keys.sh
    validate_kit_config.sh
```

---

## 11) Deployment pipeline (required)

## 11.1 PR validation workflow (`.github/workflows/ci.yml`)

### Triggers

1. `pull_request` on `main`.
2. Manual `workflow_dispatch`.

### Jobs (must pass)

1. Front matter validation:
   1. checks required fields (`title`, `date`, `lang`, `tags`, `summary`)
   2. validates `lang in {en, ko}`
2. i18n key validation:
   1. compares `en.json` and `ko.json` key parity
   2. fails on missing keys unless explicitly allowlisted
3. Build:
   1. `bundle exec jekyll build`
4. HTML/link checks:
   1. no broken internal links
   2. key pages exist (`/`, `/blog/`, `/tags/`, `/subscribe/`)
5. Kit config validation:
   1. subscribe page contains Kit form include
   2. required config values present

## 11.2 Production deploy workflow (`.github/workflows/deploy.yml`)

### Trigger

1. Push to `main` after PR merge.

### Steps

1. Checkout.
2. Setup Ruby and Bundler cache.
3. Install dependencies.
4. Build Jekyll site.
5. Upload Pages artifact.
6. Deploy using GitHub Pages action.
7. Run post-deploy smoke checks:
   1. `/` returns `200`
   2. `/subscribe/` returns `200`
   3. RSS endpoint reachable

### Environment controls

1. Use protected GitHub Environment (`production`).
2. Branch protection requires CI success before merge.

## 11.3 Rollback

1. Re-run deploy workflow for last known good commit.
2. If urgent, revert merge commit in `main` and redeploy.

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
  success_url: "/subscribe/?status=success"
  error_url: "/subscribe/?status=error"
```

## 12.3 Template integration

1. `subscribe-form.html` reads `site.kit.*`.
2. Form includes:
   1. email field
   2. submit button
   3. honeypot field (hidden)
3. Keep copy minimal and localized through `i18next`.

## 12.4 Validation gates

1. CI fails if `kit.form_action` is missing for production builds.
2. CI fails if subscribe page omits the form include.
3. Manual QA verifies:
   1. successful subscription flow
   2. confirmation email delivery
   3. unsubscribe works

---

## 13) Comments integration (utterances)

1. Store comments in a dedicated public repo.
2. Embed only on post pages.
3. Theme must follow active site theme (light/dark variants).
4. If utterances unavailable, page content still fully readable.

---

## 14) Quality checklist (definition of done)

A release is done only if all items pass.

1. Minimalist design matches screenshot intent on desktop.
2. Mobile layout remains one-column and readable without overlap.
3. Light and dark mode both pass contrast and visual QA.
4. UI strings localize correctly for `en` and `ko`.
5. Korean text renders correctly in nav, tags, body, and buttons.
6. Posts with and without `translation_key` both render correctly.
7. Optional alternate-language link appears only when variant exists.
8. Subscribe form works end-to-end with Kit.
9. CI and deploy workflows are green.
10. Production smoke checks pass.

---

## 15) Execution plan (phased)

## Phase 0 - foundation

1. Create file structure and base layouts.
2. Add typography assets and CSS token system.
3. Implement minimal header/footer shells.

## Phase 1 - core UI and responsiveness

1. Build home/blog/post/tags/subscribe layouts.
2. Implement responsive rules for mobile/tablet/desktop.
3. Match screenshot-inspired minimalist spacing and typography.

## Phase 2 - i18n and themeing

1. Add `i18next` bootstrapping.
2. Replace hardcoded UI strings with keys.
3. Add language toggle and persistence.
4. Add light/dark toggle and persistence.

## Phase 3 - post language variants

1. Enforce post `lang` front matter.
2. Add optional `translation_key` logic.
3. Render alternate-language link when applicable.
4. Emit `hreflang` for variant pairs.

## Phase 4 - integrations

1. Integrate Kit form and localized labels.
2. Integrate utterances with light/dark mapping.
3. Verify no integration adds visual clutter.

## Phase 5 - CI/CD and launch

1. Add CI workflow checks (front matter, i18n, build, link, Kit config).
2. Add deploy workflow to GitHub Pages.
3. Configure branch protection and production environment.
4. Run smoke tests and publish.

---

## 16) Acceptance criteria (final)

1. Site is minimalist, matching screenshot principles and bare necessities.
2. Works on both PC and mobile with no broken layout.
3. Supports light mode and dark mode with persistent preference.
4. Uses `i18next` for UI localization (`en`, `ko`).
5. Supports optional multilingual posts via `translation_key`.
6. Maintains Korean-capable font coverage in both themes.
7. CI/CD deploy pipeline is active and enforced.
8. Kit email integration is configured, validated, and tested.
9. Comments, RSS, SEO metadata, and accessibility requirements are met.

---

If needed, next step is converting this plan into exact files and workflows (`_layouts/*`, `assets/*`, `.github/workflows/*`, and Kit form include) with concrete code.
