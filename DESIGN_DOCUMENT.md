# Stuff of Thoughts - Detailed Design and Delivery Plan

**Domain:** `stuffs.blog`  
**Blog title (exact):** `Stuff of Thoughts`  
**Hosting:** GitHub Pages (Jekyll)  
**Email subscriptions:** Kit (newsletter/free plan)  
**Comments:** utterances (GitHub Issues-backed)  
**Infrastructure boundary:** static GitHub Pages output + third-party Kit and utterances only (no custom backend/runtime)  
**Repo visibility:** private source repo supported when GitHub Pages via Actions is available; otherwise use a public source repo  
**Localization scope:** UI localization (`en`, `ko`) + optional multilingual posts (`en`/`ko`)  
**Primary visual reference:** attached screenshot (minimal, content-first, low chrome), versioned in-repo visual reference assets

## Platform prerequisites

1. GitHub Pages deployment must run through GitHub Actions (`actions/deploy-pages`) so source can stay private while output is public.
2. If org/account policy or plan does not allow private-source Pages publishing, repository visibility must be switched to public before launch.
3. Domain and Pages preflight checklist (`CNAME`, DNS, Pages source, Environment protection, branch protection) must pass before first production deploy.

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
5. Screenshot-inspired style must be codified by approved visual baselines (see CI visual regression checks) rather than subjective review alone.

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

1. `/` and `/ko/` home + frequent tags + recent posts (optional short about paragraph).
2. `/blog/`, `/blog/page/<n>/`, `/ko/blog/`, and `/ko/blog/page/<n>/` reverse-chronological list with pagination.
3. `/blog/YYYY/MM/DD/slug/` route for posts authored with `lang: en`.
4. `/ko/blog/YYYY/MM/DD/slug/` required route pattern for posts authored with `lang: ko`.
5. `/tags/` and `/ko/tags/` tag index.
6. `/tags/<tag-slug>/`, `/tags/<tag-slug>/page/<n>/`, `/ko/tags/<tag-slug>/`, and `/ko/tags/<tag-slug>/page/<n>/` canonical tag-filtered pages.
7. `/subscribe/` and `/ko/subscribe/` Kit subscription page.
8. `/privacy/` and `/ko/privacy/` privacy notice page.
9. `/feed.xml` global RSS feed (all published posts, both locales).
10. `/feed.en.xml` English-only RSS feed.
11. `/feed.ko.xml` Korean-only RSS feed.
12. `/404.html` bilingual not-found page (GitHub Pages canonical 404 entrypoint).

### Route generation implementation contract (required)

1. Use `jekyll-paginate-v2` for `/blog/page/<n>/` and `/ko/blog/page/<n>/` generation.
2. Use a custom build plugin (`_plugins/locale_tag_pages.rb`) to generate locale-scoped paginated tag detail routes.
3. Build with plugins in GitHub Actions (not GitHub's implicit Pages builder), with plugin versions pinned by `Gemfile.lock`.
4. CI must fail when required paginated routes are missing or when page-index routes are generated outside canonical patterns.

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
9. Server-rendered fallback copy is authoritative for first paint on all non-post routes.
10. `i18next` may mutate only nodes explicitly marked for runtime updates (`data-i18n-runtime="true"`), preventing broad client-side retranslation drift.
11. `scripts/sync_i18n_data.sh` must emit a translation bundle checksum; CI fails if runtime bundle and generated server fallback payload checksums diverge.

## 4.2 Locale resolution

1. Priority order:
   1. explicit locale route prefix (`/ko/...` => `ko`)
   2. for unprefixed non-post routes only: explicit `?lang=en|ko` manual override
   3. for unprefixed non-post routes only: `localStorage.stuffs_locale` preference (used for toggle defaults)
   4. for unprefixed non-post routes only: browser language (`ko*` => `ko`, else `en`) (used for toggle defaults)
   5. fallback `en`
2. Language toggle updates:
   1. stored preference
   2. current page route to its locale equivalent for non-post pages (for example `/blog/` <-> `/ko/blog/`)
   3. current page chrome text on post pages while keeping post URL and canonical metadata stable
3. Internal links must preserve active locale prefix for non-post routes.
4. Canonical URLs must not include `?lang`.
5. Locale routes must remain shareable and crawlable.
6. Unprefixed non-post routes are canonical English entrypoints and must not auto-redirect based on browser/pref on first load.
7. If `?lang=` is present on a non-post route, client routing may navigate once to locale-equivalent prefixed route and must strip query parameters from canonicalized URL.
8. On post pages, the URL language is content-language authoritative (`lang: en` => non-`/ko`, `lang: ko` => `/ko/blog/...`); UI-language switching must not mutate post permalinks.

## 4.3 Post language model (optional multilingual support)

Each post file is authored in exactly one language.

### Required front matter

```yaml
---
layout: post
post_uid: 2026-02-14-mysql-vector-search
title: "..."
date: 2026-02-14 09:00:00 +0900
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

1. `post_uid` is required, immutable, and globally unique (`[a-z0-9][a-z0-9-]*`).
2. `date` is required and must include explicit timezone offset (`YYYY-MM-DD HH:MM:SS +/-TTTT`).
3. `lang` is required on all posts.
4. `translation_key` is optional.
5. If multiple posts share a `translation_key`, they are translation variants.
6. If no variant exists, post is treated as single-language with no errors.
7. `translation_key` format is lowercase kebab-case (`[a-z0-9-]+`).
8. For one `translation_key`, at most one `en` post and at most one `ko` post are allowed.
9. Duplicate language variants for the same `translation_key` fail CI.
10. Permalink generation strategy (required):
   1. English posts must live under `_posts/en/`.
   2. Korean posts must live under `_posts/ko/`.
   3. `_config.yml` defaults map `_posts/en/*` to `/blog/:year/:month/:day/:title/`.
   4. `_config.yml` defaults map `_posts/ko/*` to `/ko/blog/:year/:month/:day/:title/`.
   5. Manual `permalink` overrides are forbidden by default.
   6. Exception path: manual override is allowed only with `permalink_override_reason` and explicit CI allowlist entry.
11. Language-route rules:
   1. `lang: en` must never output under `/ko/...`.
   2. `lang: ko` must always output under `/ko/blog/...`.
12. Variant permalinks must be unique; CI fails on output URL collisions.
13. Permalink-change policy:
   1. when a published URL changes, old URL must be mapped in `_data/redirects.yml`.
   2. `_data/url_history.yml` is the canonical URL history ledger (`post_uid` -> ordered published URLs).
   3. CI compares current output URL for each known `post_uid` against latest `url_history` entry and fails if changed without both redirect mapping and history update.

## 4.4 Variant linking behavior

1. On post page:
   1. If exactly one variant exists in other language, show one alternate-language link.
   2. If no variant exists, show nothing.
   3. If multiple candidate variants exist, fail CI and do not deploy.
2. On index pages:
   1. Show each authored post as its own entry.
   2. On locale-scoped pages (`/blog/...`, `/ko/blog/...`, locale tag pages), language markers are optional and hidden by default to reduce visual noise.
   3. On mixed-locale surfaces (global feeds or future mixed indexes), include compact language markers (`EN` or `KO`).
3. No automatic text translation.

## 4.5 Collection locale scoping (required)

1. Locale-paired non-post routes are language-scoped:
   1. `/`, `/blog/`, `/tags/`, and `/tags/<slug>/...` list only `lang: en` posts.
   2. `/ko/`, `/ko/blog/`, `/ko/tags/`, and `/ko/tags/<slug>/...` list only `lang: ko` posts.
2. Frequent-tags computation must run against the active route locale dataset, not against all posts globally.

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
4. CI must enforce first-view font budgets for critical routes (before caching):
   1. English routes (`/`, `/blog/`, one `en` post): <= `350KB` combined WOFF2 transfer.
   2. Korean routes (`/ko/`, `/ko/blog/`, one `ko` post): <= `600KB` combined WOFF2 transfer.

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
7. Accessibility policy for code:
   1. `--code-fg` must meet WCAG AA against `--code-bg`.
   2. Syntax token colors follow a separate policy from body text and must maintain at least `3:1` against `--code-bg`.
   3. Syntax meaning must not rely on color alone; weight/italic/underline or token category structure must remain present.
   4. Accessibility gates must treat code-token contrast policy and body-text AA policy as separate checks to avoid conflicting outcomes.

## 5.5 Asset and image performance budgets

1. Critical CSS budget (home/blog/post route first view, gzip): <= `60KB`.
2. Critical JS budget (theme + i18n + utility panel + code-copy, gzip): <= `80KB`.
3. First-view non-font image transfer budget:
   1. home/blog routes: <= `150KB`.
   2. post route (excluding article body images): <= `100KB`.
4. Post body images:
   1. must provide responsive `srcset`/`sizes`.
   2. must include intrinsic dimensions (`width`/`height`) or explicit `aspect-ratio`.
   3. non-critical images must use lazy loading.

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
   6. Utility button and panel accessibility:
      1. utility button uses `aria-controls` + `aria-expanded`.
      2. panel close via `Escape` is required.
      3. when panel closes, focus returns to the utility button.
      4. opening the panel must place focus on first interactive control.
      5. while panel is open on mobile, focus must be contained within panel controls.
      6. while panel is open on mobile, background content must be inert and body scroll locked.
      7. click/tap outside panel closes it.

## 6.4 Content behavior

1. Post list remains one-column on all breakpoints.
2. Code blocks scroll horizontally on mobile.
3. Touch targets minimum `44px` height for tappable controls.
4. Font sizes never below `16px` body on mobile.
5. Post body images must reserve layout space (`width`/`height` or `aspect-ratio`) to prevent CLS.
6. Non-critical images must use lazy loading; above-the-fold images may opt out.
7. Every content image must include appropriate `alt` text (`alt=""` only for decorative images).

---

## 7) Page-level component specs

## 7.1 Home (`/`)

### Required blocks (top to bottom)

1. Minimal nav/header.
2. Frequent tags block.
3. Year-grouped recent post list.

### Frequent tags algorithm (deterministic)

1. Compute at build time from published posts only (exclude drafts/future posts).
2. Rolling window: last `365` days anchored to `SITE_CONTENT_DATE_UTC`.
3. `SITE_CONTENT_DATE_UTC` source of truth:
   1. maximum published post datetime within active locale dataset at build target.
   2. if locale dataset is empty, fallback to `SITE_BUILD_DATE_UTC`.
4. `SITE_BUILD_DATE_UTC` source of truth:
   1. CI/deploy derives it from target commit timestamp (`SOURCE_DATE_EPOCH`) for reproducible builds.
   2. snapshot tests may override both `SITE_BUILD_DATE_UTC` and `SITE_CONTENT_DATE_UTC` for deterministic assertions.
5. Dataset must be locale-scoped to the active route (`en` routes count only `lang: en`, `/ko/...` routes count only `lang: ko`).
6. Tag count rule: one count per tag per post.
7. Sort order:
   1. count descending
   2. tag name ascending (tie-break)
8. Render top `20` tags with counts.
9. Hide tags with count `< 2`.
10. `View all` must link to locale-equivalent tags index (`/tags/` or `/ko/tags/`).
11. If no tag meets threshold, render a localized empty-state sentence and hide the tag list container.
12. Implementation must be static-safe (Liquid/build script), no runtime API calls.

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
   4. language marker optional (default hidden on locale-scoped lists)
3. Locale scope:
   1. `/blog/...` includes only `lang: en` posts.
   2. `/ko/blog/...` includes only `lang: ko` posts.
4. Pagination:
   1. page size `30` posts.
   2. older/newer links at bottom only (no numbered pagination bar).

## 7.3 Post detail

1. Meta line: localized date (`en => MMM d, yyyy`, `ko => yyyy.MM.dd`) and reading time (optional override); language marker optional.
2. Title.
3. Optional alternate-language link (if `translation_key` variant exists).
4. Body content.
5. Code blocks with copy action and Monokai syntax highlighting.
6. Prev/next links are constrained to the current post language (`en` links only to `en`, `ko` only to `ko`).
7. utterances comments.
8. Small subscribe CTA.
9. UI language toggle on post pages updates chrome labels only; permalink, canonical URL, and `html[lang]` stay bound to post language.

## 7.4 Tags page

1. Frequent tags list at top.
2. Alphabetical full list below.
3. Clicking tag must navigate to canonical tag route pages (`/tags/<tag-slug>/` or `/ko/tags/<tag-slug>/`), not ad-hoc anchors.
4. Full-list ordering must use locale-aware collation:
   1. `en` routes use `en-US` collation.
   2. `ko` routes use `ko-KR` collation.
   3. if ICU collation is unavailable in CI runtime, fallback sort must be deterministic and snapshot-verified.
5. Tag slug contract:
   1. default slug is generated from normalized tag text (NFKC -> lowercase -> hyphenated slug).
   2. explicit overrides live in `_data/tag_slugs.yml` for ambiguous or colliding cases.
   3. CI fails on slug collisions per locale namespace.
6. Tag detail pagination:
   1. page size `50` posts per tag detail page.
   2. routes use `/tags/<slug>/page/<n>/` and `/ko/tags/<slug>/page/<n>/`.

## 7.5 Subscribe page

1. Short value proposition.
2. Kit HTML form POST integration (no third-party form embed script).
3. Privacy line (`unsubscribe anytime`).
4. Minimal confirmation/success messaging.
5. Success/error messaging must be locale-correct for both `/subscribe/` and `/ko/subscribe/`.

## 7.6 Privacy page

1. Explains data processing for Kit form submissions and utterances comments.
2. Lists third-party processors and links to their privacy policies.
3. Provides contact channel for privacy-related requests.
4. Keeps copy concise and available in both locale routes (`/privacy/`, `/ko/privacy/`).

## 7.7 Not-found page (`/404.html`)

1. Because GitHub Pages serves a single 404 entrypoint, page must include both English and Korean fallback copy.
2. Without JS, both language blocks remain readable.
3. With JS enabled, route/pref inference may prioritize one language block while keeping a manual language toggle available.

---

## 8) Accessibility and legibility

1. Meet WCAG AA contrast in both light and dark modes for body text, UI chrome text, links, and interactive controls; code syntax tokens follow the dedicated policy in section 5.4.
2. Focus ring always visible and keyboard navigable.
3. Respect `prefers-reduced-motion`.
4. Non-post pages set `html[lang]` from route locale (`/` => `en`, `/ko/...` => `ko`) and remain readable with JS disabled.
5. Post pages set `html[lang]` from post front matter (`lang`); locale toggle must not relabel post body language.
6. On post pages, locale-toggled chrome UI elements use element-level `lang` attributes so mixed-language UI remains semantically correct.
7. Korean paragraph wrapping uses `word-break: keep-all` plus `overflow-wrap: anywhere` fallback for URLs and long Latin tokens.
8. Every icon-only control has an accessible label.
9. Dates must be semantically marked with `<time datetime="...">` and visually localized by active UI locale.
10. Utility panel keyboard behavior is mandatory (`Tab`, `Shift+Tab`, `Escape`, focus containment while open, focus-return behavior, and inert background on mobile).
11. Code-copy action accessibility:
   1. button has locale-aware accessible name.
   2. keyboard activation via `Enter` and `Space`.
   3. copy result is announced in a polite `aria-live` region.
12. Code syntax token contrast follows section 5.4 policy (Monokai-preserving minimum `3:1`), while default code text remains AA.

---

## 9) SEO and metadata

1. Canonical base URL: `https://stuffs.blog`.
2. Every page emits canonical URL without query parameters (strip `?lang`).
3. OpenGraph + Twitter cards on all pages.
4. Expose RSS in header and `<head>`:
   1. `/feed.xml` (all locales).
   2. locale-specific links (`/feed.en.xml`, `/feed.ko.xml`) on corresponding locale routes.
5. Generate `sitemap.xml` and `robots.txt`.
6. If translation variants exist (`translation_key`), emit `hreflang` for available languages plus `x-default` to English variant when present.
7. Each language variant is self-canonical (never canonicalize to another language variant).
8. Locale-paired non-post routes (`/`<->`/ko/`, `/blog/`<->`/ko/blog/`, `/tags/`<->`/ko/tags/`, `/subscribe/`<->`/ko/subscribe/`, `/privacy/`<->`/ko/privacy/`) must emit reciprocal `hreflang` links.
9. `_config.yml` must set `url: https://stuffs.blog` and `baseurl: ""`; repository must also include `CNAME` with `stuffs.blog`.
10. Pagination canonicalization policy:
   1. canonical route is page root (`/blog/`, `/ko/blog/`, `/tags/<slug>/`, `/ko/tags/<slug>/`) for page 1.
   2. `/page/1/` routes must not be indexable (`noindex`) and must redirect or canonicalize to page-root.
   3. page `>=2` routes self-canonicalize and may emit `rel="prev"`/`rel="next"` for crawler hints.
11. Unprefixed non-post routes remain canonical English; `/ko/...` routes are discoverable via reciprocal `hreflang`.
12. CSS/JS/font references must include cache-busting (content hash in filename or build-revision query token) to avoid stale static assets.

---

## 10) Repository structure

```text
/
  CNAME
  _config.yml
  _data/
    build_meta.json
    i18n.generated.json
    redirects.yml
    url_history.yml
    tag_slugs.yml
  _plugins/
    locale_tag_pages.rb
    pagination_page_one_canonicalizer.rb
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
    js/header-utility-panel.js
    js/code-copy.js
    i18n/en.json
    i18n/ko.json
    fonts/
      CourierPrime-Regular.woff2
      NotoSerifKR-Regular.woff2
      NotoSansKR-Regular.woff2
  scripts/
    generate_build_meta.sh
    sync_i18n_data.sh
    validate_front_matter.sh
    validate_i18n_keys.sh
    validate_i18n_allowlist.sh
    validate_translation_variants.sh
    validate_permalink_strategy.sh
    validate_redirects.sh
    validate_tag_slugs.sh
    validate_pagination_routes.sh
    validate_static_constraints.sh
    validate_code_highlighting.sh
    validate_font_budget.sh
    validate_asset_budget.sh
    validate_theme_contrast.sh
    validate_seo_config.sh
    validate_hreflang_variants.sh
    validate_kit_config.sh
    validate_workflow_security.sh
    validate_visual_baseline.sh
  tests/
    visual/
      smoke.spec.ts
      no_js_locale.spec.ts
      no_js_locale_en.spec.ts
      baseline.spec.ts
  design-reference/
    baseline-manifest.json
    screenshot-reference.png
```

---

## 11) Deployment pipeline (required)

## 11.0 Static hosting constraints (GitHub Pages)

1. Final deploy artifact must be static files only (`HTML`, `CSS`, `JS`, assets).
2. No custom server runtime, API, or middleware is allowed.
3. Dynamic behavior is limited to client-side JS and third-party embeds (Kit form post + utterances script).
4. Legacy URL redirects must be generated as static pages from `_data/redirects.yml` (no server-side redirect middleware).
5. Optional CDN/proxy hardening is allowed but not required for baseline production launch.

## 11.1 PR validation workflow (`.github/workflows/ci.yml`)

### Triggers

1. `pull_request` on `main`.
2. Manual `workflow_dispatch`.

### Toolchain setup (required for CI jobs)

1. Setup Ruby from `.ruby-version` (pinned version) + Bundler cache.
2. Setup Node from `.nvmrc` (pinned version) + npm cache.
3. Enforce lockfiles:
   1. `bundle config set frozen true`
   2. `npm ci` only (no `npm install` in CI)

### Jobs (must pass)

1. Front matter validation:
   1. checks required fields (`post_uid`, `title`, `date`, `lang`, `tags`, `summary`)
   2. validates `lang in {en, ko}`
   3. validates `date` format includes timezone offset (`YYYY-MM-DD HH:MM:SS +/-TTTT`)
   4. validates `post_uid` format and uniqueness
   5. validates `translation_key` format when present
2. i18n source/sync validation:
   1. runs `scripts/sync_i18n_data.sh` and fails if generated `_data/i18n.generated.json` is out of sync
   2. compares `en.json` and `ko.json` key parity
   3. fails on missing keys unless explicitly allowlisted
   4. allowlist entries must include owner + issue link + expiry date; expired entries fail CI
   5. fails if `_data/locales/*` includes UI translation payloads
   6. fails if generated fallback payload checksum differs from runtime i18n bundle checksum
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
   1. export `SOURCE_DATE_EPOCH` from target commit timestamp
   2. generate `_data/build_meta.json` with `SITE_BUILD_DATE_UTC` and computed `SITE_CONTENT_DATE_UTC`
   3. `bundle exec jekyll build` in UTC timezone
7. HTML/link/SEO checks:
   1. no broken internal links
   2. key pages exist (`/`, `/ko/`, `/blog/`, `/ko/blog/`, `/tags/`, `/ko/tags/`, `/subscribe/`, `/ko/subscribe/`, `/privacy/`, `/ko/privacy/`, `/feed.xml`, `/feed.en.xml`, `/feed.ko.xml`)
   3. canonical tags exclude `?lang`
   4. reciprocal `hreflang` links exist for locale-paired non-post routes
   5. post variant pages emit reciprocal `hreflang` + valid `x-default` behavior per section 9
   6. pagination canonicalization policy is enforced (`/page/1/` normalization and page `>=2` self-canonical)
   7. RSS endpoint returns valid XML
   8. `url`, `baseurl`, and `CNAME` values are consistent with `https://stuffs.blog`
8. UI smoke tests (Playwright or equivalent):
   1. desktop viewport (`1366x900`): light/dark + `en/ko` toggles
   2. mobile viewport (`390x844`): light/dark + `en/ko` toggles
   3. asserts no horizontal overflow and header controls remain reachable (including utility-panel path)
   4. asserts utility-panel keyboard behavior (`aria-expanded`, `Escape`, focus return, focus containment while open)
9. No-JS localization smoke tests:
   1. JS disabled for `/`, `/blog/`, `/tags/`, `/subscribe/`, `/privacy/`, `/ko/`, `/ko/blog/`, `/ko/tags/`, `/ko/subscribe/`, and `/ko/privacy/`
   2. asserts localized fallback labels render and primary controls remain reachable for both locales
10. Accessibility audit (axe-core or equivalent):
   1. scans `/`, `/ko/`, `/blog/`, `/ko/blog/`, `/tags/`, `/ko/tags/`, one `en` post page, one `ko` post page, `/subscribe/`, `/ko/subscribe/`, `/privacy/`, and `/ko/privacy/` in light and dark themes
   2. fails on WCAG AA contrast (excluding code syntax token policy), keyboard-focus regressions, and missing accessible names
11. Code and palette validation:
   1. fails if post code block styles/tokens deviate from required Monokai values
   2. fails if post code blocks are missing minimal chrome hooks (language/filename row + copy action)
   3. fails if blog visual tokens (`--accent`, `--accent-alt`, code tokens, and tag tokens) are outside the Monokai subset
   4. fails if text-role tokens (`--text`, `--muted-text`, `--tag-text`) violate AA contrast against theme background
   5. fails if code syntax tokens violate section 5.4 minimum contrast (`3:1`) and non-color-cue rules, or if `--code-fg` violates AA
12. Kit config validation:
   1. subscribe page contains Kit form include
   2. required config values are present
   3. locale-specific success/error URLs are absolute `https://stuffs.blog/...` URLs and route-matched
   4. production gate uses `github.ref == refs/heads/main` on `push` or `workflow_dispatch`
13. Tag/slug/redirect validation:
   1. fails on locale-scope tag slug collisions
   2. fails when renamed permalinks lack a redirect mapping in `_data/redirects.yml`
14. Visual regression:
   1. compare baseline screenshots for required viewports and themes
   2. fail when diff exceeds approved threshold
15. Performance and cache validation:
   1. enforce locale-specific first-view font budgets from section 5.1
   2. enforce CSS/JS/image budgets from section 5.5
   3. fail if critical CSS/JS/font references omit configured cache-busting strategy
16. Workflow and supply-chain hardening:
   1. all GitHub Actions are pinned to full commit SHA (no floating tags).
   2. workflow/job permissions are least-privilege (`permissions:` explicitly set).
   3. dependency audits (`npm audit` and `bundle audit`) run in CI with expiring allowlist process for accepted risk.

## 11.2 Production deploy workflow (`.github/workflows/deploy.yml`)

### Trigger

1. Push to `main` after PR merge.
2. Manual `workflow_dispatch` with optional `deploy_ref` input (commit SHA only).

### Steps

1. Checkout.
2. Resolve deploy target:
   1. default to `main` head
   2. if `deploy_ref` supplied, ensure commit is reachable from `origin/main`
3. Verify target commit has successful required CI checks before deploy.
4. Run the same validation suite as PR CI (reusable workflow or equivalent script bundle) on the exact deploy target.
5. Setup Ruby and Bundler cache (pinned by `.ruby-version`).
6. Setup Node and npm cache (pinned by `.nvmrc`).
7. Install dependencies (`bundle install`, `npm ci`).
8. Export deterministic build metadata (`SOURCE_DATE_EPOCH`, `SITE_BUILD_DATE_UTC`) from deploy target commit.
9. Build static Jekyll site.
10. Upload Pages artifact.
11. Deploy using GitHub Pages action.
12. Run post-deploy smoke checks with retry/backoff (`5s`, `15s`, `30s`, `60s`, `120s`):
   1. `/`, `/ko/`, `/blog/`, `/ko/blog/`, `/tags/`, `/ko/tags/`, `/subscribe/`, `/ko/subscribe/`, `/privacy/`, and `/ko/privacy/` return `200`
   2. `/feed.xml`, `/feed.en.xml`, and `/feed.ko.xml` parse as XML
   3. one `en` and one `ko` post URL probe return `200` and include canonical + expected `hreflang`
   4. desktop and mobile smoke probes succeed
   5. JS-disabled probes on `/`, `/tags/`, `/ko/`, `/ko/tags/`, and `/ko/privacy/` succeed
   6. page-1 canonicalization checks pass (`/blog/page/1/` and tag `page/1` non-indexable and normalized)

### Environment controls

1. Use protected GitHub Environment (`production`).
2. Branch protection requires CI success before merge.
3. Deployment concurrency is single-flight (`production` group) to prevent out-of-order releases.
4. Deploy workflow permissions remain least-privilege and Actions are SHA-pinned.

## 11.3 Rollback

1. Preferred: run `workflow_dispatch` with `deploy_ref=<last-known-good-sha>` to redeploy an exact commit.
2. Fallback: revert merge commit in `main` and let push-triggered deploy run.
3. Record last-known-good SHA from successful deploy logs/artifacts.

---

## 12) Kit email integration setup (required)

## 12.1 One-time Kit setup

1. Create Kit account and publication.
2. Create locale-specific forms dedicated to `stuffs.blog` (`en`, `ko`) or an equivalent provider-supported locale-routing strategy.
3. Enable double opt-in (recommended).
4. Configure confirmation/thank-you destination page.

## 12.2 Site configuration

Add to `_config.yml`:

```yaml
kit:
  forms:
    en:
      form_action: "https://app.kit.com/forms/<FORM_ID_EN>/subscriptions"
      form_uid: "<FORM_ID_EN>"
      success_url: "https://stuffs.blog/subscribe/?status=success"
      error_url: "https://stuffs.blog/subscribe/?status=error"
    ko:
      form_action: "https://app.kit.com/forms/<FORM_ID_KO>/subscriptions"
      form_uid: "<FORM_ID_KO>"
      success_url: "https://stuffs.blog/ko/subscribe/?status=success"
      error_url: "https://stuffs.blog/ko/subscribe/?status=error"
```

Only public Kit form identifiers are allowed in repo. Do not commit Kit API secrets or tokens.

## 12.3 Template integration

1. `subscribe-form.html` reads `site.kit.forms[page.locale]`.
2. Form includes:
   1. email field
   2. submit button
   3. honeypot field (hidden)
3. Use direct HTML `<form action="https://app.kit.com/forms/.../subscriptions">` submission; do not load external Kit embed scripts.
4. Keep copy minimal and localized through shared i18n resources (`assets/i18n/*.json` + generated server fallbacks).

## 12.4 Validation gates

1. CI fails if locale-specific form config is missing for production builds (`push` or `workflow_dispatch` on `main`).
2. CI fails if subscribe page omits the form include.
3. CI fails if form action URL is not on Kit host allowlist.
4. CI fails if locale success/error URLs are not absolute `https://stuffs.blog/...` or mismatch page locale route.
5. CI fails if external Kit embed scripts are added.
6. Manual QA verifies:
   1. successful subscription flow for both locale routes
   2. confirmation email delivery
   3. unsubscribe works

---

## 13) Comments integration (utterances)

1. Store comments in a dedicated public repo.
2. Embed only on post pages.
3. Theme must follow active site theme (light/dark variants).
4. If utterances unavailable, page content still fully readable.
5. Load utterances lazily only after explicit user action ("Show comments"); do not auto-load on viewport entry.
6. Show a short privacy note near comments indicating third-party GitHub Issues-backed processing.
7. On GitHub Pages, include a restrictive meta CSP and referrer policy compatible with Kit and utterances:
   1. baseline CSP allowlist must explicitly constrain `default-src`, `script-src`, `style-src`, `img-src`, `frame-src`, `connect-src`, `font-src`, `form-action`, and `base-uri`.
   2. allowlist host scope must be minimum-required (`self`, `app.kit.com`, `utteranc.es`, `github.com`, `api.github.com`, `avatars.githubusercontent.com`).
   3. referrer policy must be `strict-origin-when-cross-origin`.
8. Meta CSP is defense-in-depth only (not equivalent to response-header CSP); this residual risk must be documented in launch notes.
9. If fronted by a proxy/CDN later, enforce equivalent or stricter header-based CSP/referrer-policy at the edge.
10. Comments and subscribe privacy notes must link to locale-equivalent privacy page (`/privacy/` or `/ko/privacy/`).
11. Operational policy:
   1. define comment moderation owners and response SLA in `docs/moderation.md`.
   2. privacy request workflow must include comment deletion handling and link users to contact channel on `/privacy/` and `/ko/privacy/`.

---

## 14) Quality checklist (definition of done)

A release is done only if all items pass.

1. Header controls follow the breakpoint matrix in section 2/6, with no horizontal overflow at `1366x900`, `768x1024`, `390x844`, and `360x780`.
2. Mobile layout remains one-column and readable without overlap.
3. Light and dark themes pass automated WCAG AA checks for body/UI text with zero critical/serious keyboard-focus failures; code syntax tokens pass section 5.4 policy.
4. Text-role tokens (`--text`, `--muted-text`, `--tag-text`) pass AA contrast validation in both themes.
5. Locale route pairs render correct server fallback copy and `html[lang]` (`/`+`/ko/`, `/blog/`+`/ko/blog/`, `/tags/`+`/ko/tags/`, `/subscribe/`+`/ko/subscribe/`, `/privacy/`+`/ko/privacy/`).
6. Non-post UI remains readable with JS disabled for both locales (`/`, `/blog/`, `/tags/`, `/subscribe/`, `/privacy/`, `/ko/`, `/ko/blog/`, `/ko/tags/`, `/ko/subscribe/`, `/ko/privacy/`).
7. Korean text renders correctly in nav, tags, body, and buttons (no tofu).
8. Posts with and without `translation_key` both render correctly.
9. `translation_key` uniqueness and language-route rules are enforced by CI.
10. Optional alternate-language link appears only when exactly one variant exists.
11. Prev/next navigation is limited to same-language posts.
12. Subscribe form works end-to-end for both locales with locale-correct success/error handling.
13. CI and deploy workflows are green; production smoke checks pass with retry/backoff.
14. utterances comments load only after explicit user action; privacy note and privacy page links are present.
15. Post code blocks use Monokai highlighting with copy action in both site themes.
16. Blog visual tokens and accents remain within the allowed Monokai subset.
17. Utility panel and code-copy controls pass keyboard and screen-reader interaction checks, including focus containment and focus return for mobile utility panel.
18. Post variant `hreflang` and `x-default` emit correctly when variants exist.
19. Frequent-tags and list outputs are reproducible for the same content set (deterministic `SITE_CONTENT_DATE_UTC` + `SITE_BUILD_DATE_UTC` policy).
20. Visual regression snapshots stay within approved diff threshold for required viewports/themes.
21. `404.html` provides readable bilingual fallback copy with functional language toggle behavior.
22. Pagination canonicalization policy is enforced (`/page/1/` normalization and page `>=2` self-canonical behavior).
23. Feed strategy is valid (`/feed.xml`, `/feed.en.xml`, `/feed.ko.xml`) and locale nav links route correctly.
24. Workflow hardening gates pass (SHA-pinned actions, least-privilege permissions, dependency audit policy).
25. Comment moderation/deletion operational policy is documented and linked from privacy routes.

---

## 15) Execution plan (phased)

## Phase 0 - foundation

1. Create file structure and base layouts.
2. Add typography assets, font-loading strategy (`font-display`, subset plan), and CSS token system.
3. Implement minimal header/footer shells and add `CNAME`.
4. Add route-generation foundation (`jekyll-paginate-v2`, locale tag-page plugin) and page-1 canonicalization strategy.
5. Add CI skeleton early (lint/build/smoke scaffolding) so each subsequent phase is validated incrementally.

## Phase 1 - core UI and responsiveness

1. Build home/blog/post/tags/subscribe layouts.
2. Implement responsive rules for mobile/tablet/desktop.
3. Add `privacy` page and English route set.
4. Match screenshot-inspired minimalist spacing and typography.
5. Add utility panel accessibility behavior and keyboard interaction tests (including focus containment/inert background on mobile).
6. Add visual baseline snapshots and in-repo baseline manifest for required viewports/themes.

## Phase 2 - i18n and theming

1. Add `i18next` bootstrapping.
2. Replace hardcoded UI strings with keys.
3. Add `scripts/sync_i18n_data.sh` and generated `_data/i18n.generated.json` fallback pipeline.
4. Add localized non-post route variants (`/ko/...`) and reciprocal `hreflang`.
5. Add language toggle with locale-route switching and persistence (no automatic first-load redirect).
6. Add light/dark toggle and persistence.
7. Enforce AA-safe text token usage rules and code-token contrast policy.
8. Add locale-collation and tag-slug validation.

## Phase 3 - post language variants

1. Enforce post front matter contract (`post_uid`, timezone-aware `date`, `lang`, required core fields).
2. Enforce `_posts/en` and `_posts/ko` path strategy with permalink defaults.
3. Add optional `translation_key` logic.
4. Render alternate-language link when applicable.
5. Emit `hreflang` for variant pairs.
6. Constrain prev/next navigation to same-language posts.
7. Add redirect map + `url_history` flow for permalink changes.

## Phase 4 - integrations

1. Integrate locale-specific Kit forms and localized labels.
2. Integrate utterances with light/dark mapping and explicit click-to-load behavior.
3. Add privacy page + privacy links for comments and subscription.
4. Add restrictive meta CSP/referrer policy with documented GitHub Pages limitations.
5. Add comment moderation/deletion operations doc and contact workflow.
6. Verify no integration adds visual clutter.

## Phase 5 - CI/CD and launch

1. Complete CI workflow checks (front matter, i18n sync/parity/fallback, permalink strategy, no-JS locale smoke for both locales, accessibility audit, build, link/SEO, Kit config, visual regression, variant hreflang, slug/redirect validation, performance budgets).
2. Add deploy workflow to GitHub Pages with restricted `workflow_dispatch deploy_ref` (commit SHA from `main` ancestry only).
3. Configure branch protection and production environment.
4. Add workflow hardening (SHA-pinned actions, least-privilege permissions, dependency-audit policy).
5. Require deploy-time revalidation of the exact target commit.
6. Add post-deploy smoke checks with retry/backoff, pagination canonicalization probes, and single-flight deploy concurrency.
7. Run smoke tests and publish.

---

## 16) Acceptance criteria (final)

1. Site is minimalist and conforms to the header/content constraints in sections 2 and 6.
2. Works on both PC and mobile with no broken layout or horizontal overflow in required smoke viewports.
3. Supports light mode and dark mode with persistent preference.
4. Uses `i18next` for UI localization (`en`, `ko`) with server-rendered locale fallbacks.
5. Non-post pages are locale-addressable (`/` and `/ko/...`) and readable with JS disabled.
6. Supports optional multilingual posts via `translation_key`.
7. Maintains Korean-capable font coverage in both themes within defined performance budgets.
8. Localization source of truth is only `assets/i18n/*.json`, with generated `_data/i18n.generated.json` and runtime bundle checksums kept in sync.
9. CI/CD deploy pipeline is active, enforced, and includes desktop/mobile smoke checks, JS-disabled locale smoke checks for both locales, accessibility audit gates, and workflow hardening gates.
10. Kit email integration is configured, validated, and tested for both locale routes with static-safe constraints and absolute redirect URLs.
11. utterances comments are integrated with explicit click-to-load consent, privacy linkage, and operational moderation/deletion policy.
12. RSS strategy is implemented and validated (`/feed.xml`, `/feed.en.xml`, `/feed.ko.xml`) with locale-appropriate nav links.
13. Language-route permalink rules, page-1 pagination canonicalization policy, and deterministic frequent-tags computation are enforced by CI.
14. Embedded post code uses enforced Monokai highlighting and CI rejects non-Monokai theme drift while applying section 5.4 code-token accessibility policy.
15. Site-wide visual token palette is enforced as a Monokai subset while text-role tokens remain AA compliant.
16. Deploy workflow can only deploy validated commits from `main` ancestry and re-validates target commits before release.
17. Tag slug collisions, locale collation order, redirect mappings, and URL-history ledger consistency are validated by CI.
18. Visual baseline checks enforce screenshot-aligned minimal style across required viewports/themes with versioned reference assets.
19. Static asset cache-busting, image-budget policy, and locale-aware 404 fallback behavior are implemented and verified.

---

If needed, next step is converting this plan into exact files and workflows (`_layouts/*`, `assets/*`, `.github/workflows/*`, and Kit form include) with concrete code.
