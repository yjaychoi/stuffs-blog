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

1. `/` home/about + frequent tags + recent posts.
2. `/blog/` full reverse-chronological list.
3. `/blog/YYYY/MM/DD/slug/` default post detail route.
4. `/ko/blog/YYYY/MM/DD/slug/` required route pattern for posts authored with `lang: ko`.
5. `/tags/` tag index.
6. `/subscribe/` Kit subscription page.
7. `/feed.xml` RSS feed.
8. `/404.html` not found page.

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
3. Resource files (single source of truth):
   1. `assets/i18n/en.json`
   2. `assets/i18n/ko.json`
4. Templates use translation keys via `data-i18n` attributes and include server-rendered fallback text.
5. Fallback text is `en` by default and must keep non-post UI readable when JS is disabled.
6. UI translation source of truth is only `assets/i18n/*.json`; `_data/locales/*` must not define UI copy.
7. Layout/include fallback literals are allowed only as progressive-enhancement defaults paired with `data-i18n` keys.

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
4. Internal links must use canonical route URLs without `?lang`.

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
8. Permalink language rule:
   1. `lang: en` uses default non-prefixed blog route (`/blog/...`) unless explicitly changed.
   2. `lang: ko` must use `/ko/blog/...`.
   3. Any manual `permalink` override must preserve the language prefix rule above.
9. Variant permalinks must be unique; CI fails on output URL collisions.

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

### Light mode tokens

1. `--bg: #f8f8f2`
2. `--surface: #f8f8f2`
3. `--text: #272822`
4. `--muted: #75715e`
5. `--border: #75715e`
6. `--accent: #f92672`
7. `--accent-alt: #fd971f`
8. `--tag-bg: #e6db74`

### Dark mode tokens

1. `--bg: #272822`
2. `--surface: #272822`
3. `--text: #f8f8f2`
4. `--muted: #75715e`
5. `--border: #75715e`
6. `--accent: #f92672`
7. `--accent-alt: #fd971f`
8. `--tag-bg: #75715e`

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
7. For text below large-text thresholds, apply accent via underline/border/marker while keeping glyph color at `--text` unless measured contrast is `>= 4.5:1`.

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
2. Rolling window: last `365` days anchored to the most recent published post date (`max(post.date)`), not wall-clock build time.
3. Tag count rule: one count per tag per post.
4. Sort order:
   1. count descending
   2. tag name ascending (tie-break)
5. Render top `20` tags with counts.
6. Hide tags with count `< 2`.
7. `View all` must link to `/tags/`.
8. Implementation must be static-safe (Liquid/build script), no runtime API calls.

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
5. Code blocks with copy action and Monokai syntax highlighting.
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
4. Non-post pages set `html[lang]` from active UI locale and update on locale toggle.
5. Post pages set `html[lang]` from post front matter (`lang`); locale toggle must not relabel post body language.
6. On post pages, locale-toggled chrome UI elements use element-level `lang` attributes so mixed-language UI remains semantically correct.
7. Korean paragraph wrapping uses `word-break: keep-all` plus `overflow-wrap: anywhere` fallback for URLs and long Latin tokens.
8. Every icon-only control has an accessible label.

---

## 9) SEO and metadata

1. Canonical base URL: `https://stuffs.blog`.
2. Every page emits canonical URL without query parameters (strip `?lang`).
3. OpenGraph + Twitter cards on all pages.
4. Expose RSS in header and `<head>`.
5. Generate `sitemap.xml` and `robots.txt`.
6. If translation variants exist (`translation_key`), emit `hreflang` for available languages plus `x-default` to English variant when present.
7. Each language variant is self-canonical (never canonicalize to another language variant).

---

## 10) Repository structure

```text
/
  _config.yml
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
    validate_translation_variants.sh
    validate_static_constraints.sh
    validate_code_highlighting.sh
    validate_kit_config.sh
  tests/
    visual/
      smoke.spec.ts
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

### Jobs (must pass)

1. Front matter validation:
   1. checks required fields (`title`, `date`, `lang`, `tags`, `summary`)
   2. validates `lang in {en, ko}`
   3. validates `translation_key` format when present
2. i18n key validation:
   1. compares `en.json` and `ko.json` key parity
   2. fails on missing keys unless explicitly allowlisted
   3. fails if `_data/locales/*` includes UI translation payloads
3. Translation variant validation:
   1. enforces max one `en` and one `ko` per `translation_key`
   2. enforces language-route rule (`lang: ko` -> `/ko/blog/...`)
   3. enforces language-route rule (`lang: en` -> non-`/ko/...` route)
   4. fails on duplicate output permalinks
4. Progressive-enhancement i18n validation:
   1. fails if critical nav labels are JS-only with no server-rendered fallback text
   2. fails if fallback literals in templates/includes are missing matching `data-i18n` keys
5. Static constraint validation:
   1. fails if templates introduce internal API calls or server-only dependencies
6. Build:
   1. `bundle exec jekyll build`
7. HTML/link checks:
   1. no broken internal links
   2. key pages exist (`/`, `/blog/`, `/tags/`, `/subscribe/`, `/feed.xml`)
   3. canonical tag excludes `?lang`
   4. RSS endpoint returns valid XML
8. UI smoke tests (Playwright or equivalent):
   1. desktop viewport (`1366x900`): light/dark + `en/ko` toggles
   2. mobile viewport (`390x844`): light/dark + `en/ko` toggles
   3. asserts no horizontal overflow and header controls remain reachable (including utility-panel path)
9. Accessibility audit (axe-core or equivalent):
   1. scans `/`, `/blog/`, one post page, and `/subscribe/` in light and dark themes
   2. fails on WCAG AA contrast and keyboard-focus regressions
10. Code and palette validation:
   1. fails if post code block styles/tokens deviate from required Monokai values
   2. fails if post code blocks are missing minimal chrome hooks (language/filename row + copy action)
   3. fails if blog visual tokens (`--accent`, `--accent-alt`, code tokens, and tag tokens) are outside the Monokai subset
11. Kit config validation:
   1. subscribe page contains Kit form include
   2. required config values present

## 11.2 Production deploy workflow (`.github/workflows/deploy.yml`)

### Trigger

1. Push to `main` after PR merge.

### Steps

1. Checkout.
2. Setup Ruby and Bundler cache.
3. Install dependencies.
4. Build static Jekyll site.
5. Upload Pages artifact.
6. Deploy using GitHub Pages action.
7. Run post-deploy smoke checks:
   1. `/` returns `200`
   2. `/subscribe/` returns `200`
   3. `/feed.xml` returns `200` and parses as XML
   4. one desktop and one mobile smoke probe succeed

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

Only public Kit form identifiers are allowed in repo. Do not commit Kit API secrets or tokens.

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
3. CI fails if form action URL is not on Kit host allowlist.
4. Manual QA verifies:
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
7. If fronted by a proxy/CDN, apply CSP and referrer-policy headers compatible with Kit and utterances.

---

## 14) Quality checklist (definition of done)

A release is done only if all items pass.

1. Minimalist design matches screenshot intent on desktop.
2. Mobile layout remains one-column and readable without overlap.
3. Light and dark mode both pass contrast and visual QA.
4. UI strings localize correctly for `en` and `ko`.
5. Korean text renders correctly in nav, tags, body, and buttons.
6. Posts with and without `translation_key` both render correctly.
7. `translation_key` uniqueness rules are enforced by CI.
8. Optional alternate-language link appears only when exactly one variant exists.
9. Subscribe form works end-to-end with Kit.
10. CI and deploy workflows are green.
11. Production smoke checks pass.
12. Non-post UI remains readable with JS disabled (i18n fallback requirement).
13. Third-party embeds are lazy-loaded and privacy notice is present on post comments section.
14. Post code blocks use Monokai highlighting with copy action in both light and dark site themes.
15. Blog visual tokens and accents remain within the allowed Monokai subset.

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

1. Add CI workflow checks (front matter, i18n parity + fallback, permalink rules, accessibility audit, build, link, Kit config).
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
7. Localization source of truth is only `assets/i18n/*.json`.
8. CI/CD deploy pipeline is active, enforced, and includes desktop/mobile UI smoke checks plus accessibility audit gates.
9. Kit email integration is configured, validated, and tested with static-safe constraints.
10. Comments, RSS, SEO metadata, and accessibility requirements are met.
11. Language-route permalink rules and deterministic frequent-tags computation are enforced by CI.
12. Embedded post code uses enforced Monokai highlighting and CI rejects non-Monokai theme drift.
13. Site-wide visual token palette is enforced as a Monokai subset.

---

If needed, next step is converting this plan into exact files and workflows (`_layouts/*`, `assets/*`, `.github/workflows/*`, and Kit form include) with concrete code.
