# Stuff of Thoughts - Detailed Design and Delivery Plan (English-Only)

**Domain:** `stuffs.blog`  
**Blog title (exact):** `Stuff of Thoughts`  
**Hosting:** GitHub Pages (Jekyll)  
**Email subscriptions:** Kit (newsletter/free plan)  
**Comments:** utterances (GitHub Issues-backed)  
**Infrastructure boundary:** static GitHub Pages output + third-party Kit and utterances only (no custom backend/runtime)  
**Repo visibility:** private source repo (GitHub Plus) with GitHub Pages deployment via Actions  
**Localization scope:** none (English-only UI and posts)  
**Primary visual reference:** none (no screenshot/baseline-image dependency)

## Platform prerequisites

1. GitHub Pages deployment must run through GitHub Actions (`actions/deploy-pages`) so source can stay private while output is public.
2. Domain and Pages preflight checklist (`CNAME`, DNS, Pages source, Environment protection, branch protection) must pass before first production deploy.
3. Build and deploy artifacts must remain static (`HTML`, `CSS`, `JS`, fonts, images) with no backend runtime.

---

## 1) Product goals

### Primary goals

1. Publish by committing Markdown files to GitHub.
2. Keep interface minimal to bare necessities only.
3. Preserve a narrow centered-column style: simple nav, sparse metadata, understated accents.
4. Support both desktop (PC) and mobile without layout breakage.
5. Support both light and dark mode with equal design quality.
6. Keep implementation and operations simple enough for solo maintenance.
7. Deploy automatically through CI/CD, including validated Kit email integration.
8. Support subscriber signup and automated new-post notifications via Kit.

### Non-goals

1. No custom backend.
2. No heavy animations or decorative UI.
3. No dashboard widgets, side panels, carousels, or hero graphics.
4. No localization/i18n framework or multilingual routing.

---

## 2) Minimalist design contract (strict)

This section is mandatory and overrides stylistic ambiguity.

### Required layout shape

1. One centered main column.
2. Simple top nav row with only essential links.
3. Text-first content blocks (about copy, tags, post links).
4. Minimal accent usage (maximum two accent roles) and every accent must come from the Monokai palette subset.
5. Style must be codified by explicit token/layout/accessibility checks rather than screenshot baselines.

### Maximum UI surface area

1. Header control set must include: `Home`, `Blog`, `RSS`, `Subscribe`, and theme toggle.
2. Desktop (`>=1024px`): show `Home`, `Blog`, `RSS`, and `Subscribe` inline; theme toggle must be reachable.
3. Tablet (`640-1023px`): show title (`Home`), `Blog`, `RSS`, and `Subscribe` inline when possible; controls may wrap as needed.
4. Mobile (`420-639px`): keep `Home`, `Blog`, `RSS`, and `Subscribe` reachable without JS-only menus; theme toggle must remain reachable.
5. Narrow mobile (`<420px`): controls may wrap to multiple rows, but all primary links remain reachable without hidden JS-only menus.
6. No secondary content nav bars.
7. No persistent sidebars on mobile.
8. No card-heavy grids for the post index.
9. No oversized hero section on index page.

### Forbidden elements

1. Social feed embeds.
2. Animated background effects.
3. Accent systems with more than two accent roles.
4. Any accent color outside the Monokai subset.
5. Floating action buttons.
6. Non-essential badges/chips except tags.

---

## 3) Information architecture

### Routes

1. `/` home with short about paragraph + latest posts list.
2. `/blog/` and `/blog/page/<n>/` reverse-chronological list with pagination.
3. `/blog/YYYY/MM/DD/slug/` post detail route.
4. `/tags/` tag index.
5. `/tags/<tag-slug>/` canonical tag-filtered page.
6. `/subscribe/` Kit subscription page.
7. `/subscribe/success/` subscribe success page (`/subscribe/error/` optional).
8. `/privacy/` privacy notice page.
9. `/feed.xml` RSS feed.
10. `/404.html` not-found page (GitHub Pages canonical 404 entrypoint).

### Route generation implementation contract (required)

1. Use `jekyll-paginate-v2` for `/blog/page/<n>/` generation.
2. Build with plugins in GitHub Actions (not GitHub's implicit Pages builder), with plugin versions pinned by `Gemfile.lock`.
3. CI must fail when required blog pagination routes are missing or when page-index routes are generated outside canonical patterns.

### Navigation (global)

1. `Home`
2. `Blog`
3. `RSS`
4. `Subscribe`
5. `Light/Dark` toggle

### Future slots (reserved but hidden)

1. Header/footer social slot sized for GitHub + LinkedIn links later.
2. Layout must not shift when those links are enabled.

---

## 4) Content model (English-only)

Each post file is authored in English.

### Required front matter

```yaml
---
layout: post
post_uid: 2026-02-14-mysql-vector-search
slug: mysql-vector-search
title: "..."
date: 2026-02-14 09:00:00 +0900
tags: [css, javascript]
summary: "One sentence summary."
featured: false
---
```

### Rules

1. `post_uid` is required, immutable, and globally unique (`[a-z0-9][a-z0-9-]*`).
2. `date` is required and must include explicit timezone offset (`YYYY-MM-DD HH:MM:SS +/-TTTT`).
3. `slug` is required, immutable after publish, and URL-safe (`[a-z0-9][a-z0-9-]*`).
4. Permalink generation strategy (required):
   1. posts live under `_posts/`.
   2. `_config.yml` defaults map `_posts/*` to `/blog/:year/:month/:day/:slug/`.
   3. Manual `permalink` overrides are forbidden.
5. URL change policy (rare):
   1. if a published URL must change, add one static redirect entry to `_data/redirects.yml`.
   2. CI validates redirect-file syntax and duplicate-free mappings.

---

## 5) Visual system

## 5.1 Typography

### Heading/title stack

1. Primary: `Courier Prime` (self-hosted WOFF2).
2. Fallbacks: `Georgia`, `Times New Roman`, `serif`.

### Body stack

1. `system-ui`, `-apple-system`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial`, `sans-serif`.

### Font loading and performance

1. Self-hosted fonts must use `font-display: swap`.
2. Provide subset files using `unicode-range` to reduce first paint cost.
3. Preload only the title font and primary body font used above the fold on first view.
4. CI must enforce first-view font budgets for critical routes (before caching):
   1. critical routes (`/`, `/blog/`, one post): <= `350KB` combined WOFF2 transfer.

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
5. If `localStorage` is unavailable, theme still follows `prefers-color-scheme` and toggle works for the current page session without uncaught errors.

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
2. Critical JS budget (theme + code-copy + comments loader, gzip): <= `60KB`.
3. First-view non-font image transfer budget:
   1. home/blog routes: <= `150KB`.
   2. post route (excluding article body images): <= `100KB`.
4. Post body images:
   1. must provide responsive `srcset`/`sizes`.
   2. must include intrinsic dimensions (`width`/`height`) or explicit `aspect-ratio`.
   3. non-critical images must use lazy loading.
   4. external asset hosts (if any) must be declared in `_data/external_asset_hosts.yml`; CI fails if rendered image/script/frame hosts are outside the explicit allowlist.
5. Budget measurement policy (deterministic):
   1. CI uses `size-limit` for CSS/JS gzip budgets and deterministic Vitest file-size checks for image/font budgets.
   2. Allowed overage tolerance is `0KB` (hard fail) to keep behavior predictable.

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
   1. Inline nav row with `Home`, `Blog`, `RSS`, `Subscribe`, and theme toggle visible.
2. Tablet (`640-1023px`):
   1. Same controls remain visible.
   2. Controls may wrap to a second row when needed.
3. Mobile:
   1. Same controls remain visible at `420-639px` and `<420px`.
   2. Controls may wrap to multiple rows.
   3. Header must not introduce horizontal scrolling.
4. No-JS requirement:
   1. Header navigation and theme default (`prefers-color-scheme`) must remain functional without JavaScript.

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
2. One short about paragraph.
3. Latest posts list (reverse-chronological, no year grouping, maximum `5` items).

### Latest posts algorithm (deterministic)

1. Compute at build time from published posts only (exclude drafts/future posts).
2. Sort order:
   1. post datetime descending
   2. `post_uid` ascending (tie-break for deterministic output)
3. Render up to `5` posts.
4. Per item output includes date in `<time datetime="...">` and post title link.
5. If dataset is empty, render an explicit empty-state sentence.
6. `SITE_BUILD_DATE_UTC` source of truth:
   1. CI/deploy derives it from target commit timestamp (`SOURCE_DATE_EPOCH`) for reproducible builds.
   2. contract tests may override `SITE_BUILD_DATE_UTC` for deterministic assertions.
7. Implementation must be static-safe (Liquid/build script), no runtime API calls.

### Must not include

1. Hero image.
2. Multi-column cards.
3. Sticky sidebars.

## 7.2 Blog index (`/blog/`)

1. Reverse-chronological list (no year grouping).
2. Per item:
   1. date in `<time datetime="...">` (visible format `MMM d, yyyy`; machine value ISO-8601)
   2. title link
   3. tags
3. Pagination:
   1. page size `30` posts.
   2. older/newer links at bottom only (no numbered pagination bar).

## 7.3 Post detail

1. Meta line: date (`MMM d, yyyy`) and reading time (optional override).
2. Title.
3. Body content.
4. Code blocks with copy action and Monokai syntax highlighting.
5. Prev/next links follow chronological order.
6. utterances comments.
7. Small subscribe CTA.

## 7.4 Tags page

1. Alphabetical full list.
2. Clicking tag must navigate to canonical tag route pages (`/tags/<tag-slug>/`), not ad-hoc anchors.
3. Full-list ordering must use deterministic `en-US` collation; if ICU collation is unavailable, fallback sort must be deterministic and contract-tested.
4. Tag slug contract:
   1. default slug is generated from normalized tag text (NFKC -> lowercase -> hyphenated slug).
   2. explicit overrides live in `_data/tag_slugs.yml` for ambiguous or colliding cases.
   3. CI fails on slug collisions.

## 7.5 Subscribe page

1. Short value proposition.
2. Kit HTML form POST integration (no third-party form embed script).
3. Privacy line (`unsubscribe anytime`).
4. Minimal confirmation/success messaging.
5. Success uses dedicated status route (`/subscribe/success/`).
6. Error handling may use optional `/subscribe/error/` route when supported by provider; otherwise keep concise inline recovery copy on `/subscribe/`.

## 7.6 Privacy page

1. Explains data processing for Kit form submissions and utterances comments.
2. Lists third-party processors and links to their privacy policies.
3. Provides contact channel for privacy-related requests.
4. Keeps copy concise.

## 7.7 Not-found page (`/404.html`)

1. Because GitHub Pages serves a single 404 entrypoint, page must include clear English fallback copy.
2. Without JS, primary recovery links (Home/Blog) remain usable.
3. With JS enabled, no extra behavior is required beyond preserving readability and navigation.

---

## 8) Accessibility and legibility

1. Meet WCAG AA contrast in both light and dark modes for body text, UI chrome text, links, and interactive controls; code syntax tokens follow the dedicated policy in section 5.4.
2. Focus ring always visible and keyboard navigable.
3. Respect `prefers-reduced-motion`.
4. `html[lang]` is set to `en`.
5. Every icon-only control has an accessible label.
6. Dates must be semantically marked with `<time datetime="...">`.
7. Header controls are keyboard reachable at every breakpoint without hidden-menu dependencies.
8. Code-copy action accessibility:
   1. button has an accessible name.
   2. keyboard activation via `Enter` and `Space`.
   3. copy result is announced in a polite `aria-live` region.
9. Code syntax token contrast follows section 5.4 policy (Monokai-preserving minimum `3:1`), while default code text remains AA.
10. Provide a visible skip link that moves focus to main content.
11. Use semantic landmarks (`header`, `nav`, `main`, `footer`) with consistent accessible names where needed.
12. Form validation errors (subscribe workflows) must be programmatically associated (`aria-describedby`), announced, and focus-directed to the first invalid field on submit failure.

---

## 9) SEO and metadata

1. Canonical base URL: `https://stuffs.blog`.
2. Every page emits canonical URL without query parameters.
3. OpenGraph + Twitter cards on all pages.
4. Expose RSS in header and `<head>`:
   1. `/feed.xml`.
5. Generate `sitemap.xml` and `robots.txt`.
6. `_config.yml` must set `url: https://stuffs.blog` and `baseurl: ""`; repository must also include `CNAME` with `stuffs.blog`.
7. Pagination canonicalization policy:
   1. canonical route is page root (`/blog/`, `/tags/<slug>/`) for page 1.
   2. `/blog/page/1/` must not be indexable (`noindex`) and must redirect or canonicalize to `/blog/`.
   3. `/blog/page/<n>/` for page `>=2` self-canonicalizes and may emit `rel="prev"`/`rel="next"` for crawler hints.
8. CSS/JS/font references must include cache-busting (content hash in filename or build-revision query token) to avoid stale static assets.
9. Canonical host policy is apex-only (`https://stuffs.blog`); `www.stuffs.blog` (if configured) must 301 to apex at DNS/proxy layer and never appear in canonical tags.

---

## 10) Repository structure

```text
/
  .github/
    workflows/
      ci.yml
      deploy.yml
  CNAME
  _config.yml
  _data/
    build_meta.json
    redirects.yml
    tag_slugs.yml
    external_asset_hosts.yml
  _includes/
    header.html
    footer.html
    subscribe-form.html
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
  assets/
    css/main.css
    js/theme.js
    js/code-copy.js
    js/comments.js
    fonts/
      CourierPrime-Regular.woff2
  package.json
  vitest.config.ts
  playwright.config.ts
  size-limit.config.cjs
  tests/
    contracts/
      front_matter.spec.ts
      permalink.spec.ts
      redirects.spec.ts
      tags.spec.ts
      seo.spec.ts
      feed.spec.ts
      static_constraints.spec.ts
      code_highlighting.spec.ts
      font_budget.spec.ts
      asset_budget.spec.ts
      theme_contrast.spec.ts
      kit_config.spec.ts
    e2e/
      smoke.spec.ts
      no_js.spec.ts
      accessibility.spec.ts
  docs/
    moderation.md
```

---

## 11) Deployment pipeline (required)

## 11.0 Static hosting constraints (GitHub Pages)

1. Final deploy artifact must be static files only (`HTML`, `CSS`, `JS`, assets).
2. No custom server runtime, API, or middleware is allowed.
3. Dynamic behavior is limited to client-side JS and third-party embeds (Kit form post + utterances script).
4. Legacy URL redirects must be generated as static pages from `_data/redirects.yml` (no server-side redirect middleware).
5. Baseline launch must include an explicit transport/security hardening decision record: either (a) direct GitHub Pages with documented residual header limitations, or (b) CDN/proxy edge enforcement of equivalent-or-stronger security headers.

## 11.1 PR validation workflow (`.github/workflows/ci.yml`)

### Triggers

1. `pull_request` on `main`.
2. `push` on `main`.
3. `merge_group` (when merge queue is enabled).
4. Manual `workflow_dispatch`.

### Toolchain setup (required for CI jobs)

1. Setup Ruby from `.ruby-version` (pinned version) + Bundler cache.
2. Setup Node from `.nvmrc` (pinned version) + npm cache.
3. Enforce lockfiles:
   1. `bundle config set frozen true`
   2. `npm ci` only (no `npm install` in CI)

### Jobs (must pass)

All validation logic must live in Node-based test frameworks (`Vitest` + `Playwright`), not ad-hoc shell validator scripts.

1. Build:
   1. export `SOURCE_DATE_EPOCH` from target commit timestamp
   2. generate `_data/build_meta.json` with `SITE_BUILD_DATE_UTC`
   3. `bundle exec jekyll build` in UTC timezone
2. Front matter and permalink validation (`tests/contracts/front_matter.spec.ts`, `tests/contracts/permalink.spec.ts`):
   1. checks required fields (`post_uid`, `title`, `date`, `tags`, `summary`)
   2. validates `date` format includes timezone offset (`YYYY-MM-DD HH:MM:SS +/-TTTT`)
   3. validates `post_uid` format and uniqueness
   4. fails any manual `permalink` override
3. Static constraint validation:
   1. fails if templates introduce internal API calls or server-only dependencies
4. HTML/link/SEO checks:
   1. no broken internal links
   2. key pages exist (`/`, `/blog/`, `/tags/`, `/subscribe/`, `/subscribe/success/`, `/privacy/`, `/feed.xml`, `/404.html`)
   3. canonical tags are present and consistent
   4. blog pagination canonicalization policy is enforced (`/blog/page/1/` normalization and page `>=2` self-canonical)
   5. RSS endpoint returns valid XML
   6. `url`, `baseurl`, and `CNAME` values are consistent with `https://stuffs.blog`
5. UI smoke tests (Playwright):
   1. desktop viewport (`1366x900`) with light/dark toggle
   2. mobile viewport (`390x844`) with light/dark toggle
   3. asserts no horizontal overflow and header controls remain reachable
6. No-JS smoke tests:
   1. JS disabled for `/`, `/blog/`, `/tags/`, `/subscribe/`, `/privacy/`
   2. asserts primary controls remain reachable and core reading flow works
7. Accessibility audit (axe-core or equivalent):
   1. scans `/`, `/blog/`, `/tags/`, one post page, `/subscribe/`, and `/privacy/` in light and dark themes
   2. fails on WCAG AA contrast (excluding code syntax token policy), keyboard-focus regressions, and missing accessible names
8. Code and palette validation:
   1. fails if post code block styles/tokens deviate from required Monokai values
   2. fails if post code blocks are missing minimal chrome hooks (language/filename row + copy action)
   3. fails if blog visual tokens (`--accent`, `--accent-alt`, code tokens, and tag tokens) are outside the Monokai subset
   4. fails if text-role tokens (`--text`, `--muted-text`, `--tag-text`) violate AA contrast against theme background
   5. fails if code syntax tokens violate section 5.4 minimum contrast (`3:1`) and non-color-cue rules, or if `--code-fg` violates AA
9. Kit config validation:
   1. subscribe page contains Kit form include
   2. required config values are present
   3. `success_url` is absolute `https://stuffs.blog/...` and route-matched
   4. if `error_url` is configured, it must be absolute `https://stuffs.blog/...` and route-matched
10. Tag/slug/redirect validation:
   1. fails on tag slug collisions
   2. redirect mappings are duplicate-free and syntactically valid
11. Performance and cache validation:
   1. enforce first-view font budget from section 5.1
   2. enforce CSS/JS/image budgets from section 5.5 using `size-limit` (CSS/JS) plus deterministic Vitest file-size checks (images/fonts)
   3. fail if critical CSS/JS/font references omit configured cache-busting strategy
12. Workflow baseline hardening:
   1. workflow/job permissions are least-privilege (`permissions:` explicitly set).
   2. Actions use pinned major versions or full commit SHA.

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
4. Run the same validation suite as PR CI (reusable workflow or equivalent `npm run test:contracts && npm run test:e2e`) on the exact deploy target.
5. Setup Ruby and Bundler cache (pinned by `.ruby-version`).
6. Setup Node and npm cache (pinned by `.nvmrc`).
7. Install dependencies with lockfile enforcement (`bundle config set frozen true`, `bundle install`, `npm ci`).
8. Export deterministic build metadata (`SOURCE_DATE_EPOCH`, `SITE_BUILD_DATE_UTC`) from deploy target commit.
9. Build static Jekyll site.
10. Upload Pages artifact.
11. Deploy using GitHub Pages action.
12. Run post-deploy smoke checks with retry/backoff (`5s`, `15s`, `30s`, `60s`, `120s`):
   1. `/`, `/blog/`, `/tags/`, `/subscribe/`, `/subscribe/success/`, `/privacy/`, and `/feed.xml` return `200`
   2. `/feed.xml` parses as XML
   3. one post URL probe returns `200` and includes canonical metadata
   4. desktop and mobile smoke probes succeed
   5. JS-disabled probes on `/`, `/tags/`, and `/privacy/` succeed
   6. page-1 canonicalization checks pass (`/blog/page/1/` non-indexable and normalized)
   7. unknown-route probe returns `404` and renders readable fallback copy

### Environment controls

1. Use protected GitHub Environment (`production`).
2. Branch protection requires CI success before merge.
3. Deployment concurrency is single-flight (`production` group) to prevent out-of-order releases.
4. Deploy workflow permissions remain least-privilege and Actions use pinned versions (major version or full SHA).

## 11.3 Rollback

1. Preferred: run `workflow_dispatch` with `deploy_ref=<last-known-good-sha>` to redeploy an exact commit.
2. Fallback: revert merge commit in `main` and let push-triggered deploy run.
3. Record last-known-good SHA from successful deploy logs/artifacts.

---

## 12) Kit email integration setup (required)

## 12.1 One-time Kit setup

1. Create Kit account and publication.
2. Create one form dedicated to `stuffs.blog`.
3. Enable double opt-in (recommended).
4. Configure confirmation/thank-you destination page.

## 12.2 Site configuration

Add to `_config.yml`:

```yaml
kit:
  form:
    form_action: "https://app.kit.com/forms/<FORM_ID>/subscriptions"
    form_uid: "<FORM_ID>"
    success_url: "https://stuffs.blog/subscribe/success/"
    # Optional if your Kit plan/flow supports custom error redirects:
    # error_url: "https://stuffs.blog/subscribe/error/"
```

Only public Kit form identifiers are allowed in repo. Do not commit Kit API secrets or tokens.

## 12.3 Template integration

1. `subscribe-form.html` reads `site.kit.form`.
2. Form includes:
   1. email field
   2. submit button
   3. honeypot field (hidden)
3. Use direct HTML `<form action="https://app.kit.com/forms/.../subscriptions">` submission; do not load external Kit embed scripts.
4. Keep copy minimal.

## 12.4 New-post notifications (required)

1. New-post notifications are handled by Kit automation consuming `https://stuffs.blog/feed.xml`.
2. Configure Kit automation with:
   1. trigger: new feed item
   2. dedupe key: feed GUID/post URL
   3. audience: blog subscribers
3. Manual fallback: if RSS automation is unavailable on current plan, send manual broadcast from latest post URL.

## 12.5 Validation gates

1. CI fails if form config is missing for production builds (`push` or `workflow_dispatch` on `main`).
2. CI fails if subscribe page omits the form include.
3. CI fails if form action URL is not on Kit host allowlist.
4. CI fails if `success_url` is not absolute `https://stuffs.blog/...`; if `error_url` exists, it must also be absolute `https://stuffs.blog/...`.
5. CI fails if external Kit embed scripts are added.
6. Manual QA verifies:
   1. successful subscription flow
   2. confirmation email delivery
   3. unsubscribe works
   4. one feed-driven or manual post notification send succeeds

---

## 13) Comments integration (utterances)

1. Store comments in a dedicated public repo.
2. Embed only on post pages.
3. Theme must follow active site theme (light/dark variants).
4. If utterances unavailable, page content still fully readable.
5. Load utterances lazily only after explicit user action (`Show comments`); do not auto-load on viewport entry.
6. Show a short privacy note near comments indicating third-party GitHub Issues-backed processing.
7. On GitHub Pages, include a restrictive meta CSP and referrer policy compatible with Kit and utterances:
   1. baseline CSP allowlist must explicitly constrain `default-src`, `script-src`, `style-src`, `img-src`, `frame-src`, `connect-src`, `font-src`, `form-action`, and `base-uri`.
   2. allowlist host scope must be minimum-required (`self`, `app.kit.com`, `utteranc.es`, `github.com`, `api.github.com`, `avatars.githubusercontent.com`) plus explicitly declared external asset hosts from `_data/external_asset_hosts.yml` when needed.
   3. referrer policy must be `strict-origin-when-cross-origin`.
8. Meta CSP is defense-in-depth only (not equivalent to response-header CSP); this residual risk must be documented in launch notes.
9. If fronted by a proxy/CDN later, enforce equivalent or stricter header-based CSP/referrer-policy at the edge.
10. Operational policy:
   1. define comment moderation owners and response SLA in `docs/moderation.md`.
   2. privacy request workflow includes comment deletion handling and links users to contact channel on `/privacy/`.

---

## 14) Quality checklist (definition of done)

A release is done only if all items pass.

1. Header controls follow the breakpoint matrix in section 2/6, with no horizontal overflow at required smoke viewports `1366x900` and `390x844` (plus manual verification at `768x1024` and `360x780`).
2. Mobile layout remains one-column and readable without overlap.
3. Light and dark themes pass automated WCAG AA checks for body/UI text with zero critical/serious keyboard-focus failures; code syntax tokens pass section 5.4 policy.
4. Text-role tokens (`--text`, `--muted-text`, `--tag-text`) pass AA contrast validation in both themes.
5. Non-post UI remains readable with JS disabled for `/`, `/blog/`, `/tags/`, `/subscribe/`, and `/privacy/`.
6. Subscribe form works end-to-end with success handling and clear error fallback behavior.
7. Kit feed-based notification flow is configured and tested.
8. CI and deploy workflows are green; production smoke checks pass with retry/backoff.
9. utterances comments load only after explicit user action; privacy note and privacy page links are present.
10. Post code blocks use Monokai highlighting with copy action in both site themes.
11. Blog visual tokens and accents remain within the allowed Monokai subset.
12. Header and code-copy controls pass keyboard and screen-reader interaction checks.
13. Home latest-post list and other list outputs are reproducible for the same content set (deterministic `SITE_BUILD_DATE_UTC` policy).
14. No screenshot-baseline visual-diff process is required.
15. `404.html` provides readable fallback copy and unknown routes return `404`.
16. Blog pagination canonicalization policy is enforced (`/blog/page/1/` normalization and page `>=2` self-canonical behavior).
17. Feed strategy is valid (`/feed.xml`) and nav links route correctly.
18. Workflow baseline hardening gates pass (least-privilege permissions and pinned action versions).
19. Comment moderation/deletion operational policy is documented and linked from privacy route.

---

## 15) Execution plan (phased)

## Phase 0 - foundation

1. Create file structure and base layouts.
2. Add typography assets, font-loading strategy (`font-display`, subset plan), and CSS token system.
3. Implement minimal header/footer shells and add `CNAME`.
4. Add route-generation foundation (`jekyll-paginate-v2`) and page-1 canonicalization strategy.
5. Add CI skeleton early so each subsequent phase is validated incrementally.

## Phase 1 - core UI and responsiveness

1. Build home/blog/post/tags/subscribe layouts (home = about paragraph + latest posts list, no year grouping).
2. Implement responsive rules for mobile/tablet/desktop.
3. Add `privacy` page.
4. Match the minimalist spacing and typography contract.
5. Keep header controls always visible (wrapping allowed) and verify keyboard/no-JS behavior.

## Phase 2 - core content and theming

1. Enforce post front matter contract (`post_uid`, timezone-aware `date`, required core fields).
2. Enforce permalink strategy with immutable `slug` and simple static-redirect policy.
3. Add light/dark toggle and persistence.
4. Enforce AA-safe text token usage rules and code-token contrast policy.
5. Add tag slug validation.

## Phase 3 - integrations

1. Integrate Kit form and labels.
2. Integrate Kit RSS automation for new-post notifications.
3. Integrate utterances with light/dark mapping and explicit click-to-load behavior.
4. Wire privacy links and processor disclosures for comments and subscription.
5. Add restrictive meta CSP/referrer policy with documented GitHub Pages limitations.
6. Add comment moderation/deletion operations doc and contact workflow.

## Phase 4 - CI/CD and launch

1. Complete CI workflow checks (build, front matter/permalink, link/SEO, desktop+mobile smoke, no-JS smoke, accessibility audit, Kit config, slug/redirect validation, performance budgets).
2. Add deploy workflow to GitHub Pages with restricted `workflow_dispatch deploy_ref` (commit SHA from `main` ancestry only).
3. Configure branch protection and production environment.
4. Add workflow baseline hardening (pinned action versions and least-privilege permissions).
5. Require deploy-time revalidation of the exact target commit.
6. Add post-deploy smoke checks with retry/backoff, blog pagination canonicalization probes, and single-flight deploy concurrency.
7. Run smoke tests and publish.

---

## 16) Acceptance criteria (final)

1. Site is minimalist and conforms to the header/content constraints in sections 2 and 6.
2. Works on both PC and mobile with no broken layout or horizontal overflow in required smoke viewports.
3. Supports light mode and dark mode with persistent preference.
4. Is English-only (no localization or multilingual requirements).
5. CI/CD deploy pipeline is active, enforced, and includes desktop/mobile smoke checks, JS-disabled smoke checks, accessibility audit gates, and workflow hardening gates.
6. Kit email integration is configured, validated, and tested with static-safe constraints and absolute redirect URLs (`success_url` required, `error_url` optional).
7. Kit new-post notifications are configured through RSS automation or validated manual fallback.
8. utterances comments are integrated with explicit click-to-load consent, privacy linkage, and operational moderation/deletion policy.
9. RSS strategy is implemented and validated (`/feed.xml`) with nav integration.
10. Permalink rules (immutable `slug`), blog page-1 canonicalization policy, and deterministic home latest-post computation are enforced by CI.
11. Embedded post code uses enforced Monokai highlighting and CI rejects non-Monokai theme drift while applying section 5.4 code-token accessibility policy.
12. Site-wide visual token palette is enforced as a Monokai subset while text-role tokens remain AA compliant.
13. Deploy workflow can only deploy validated commits from `main` ancestry and re-validates target commits before release.
14. Tag slug collisions and redirect-file consistency are validated by CI.
15. Static asset cache-busting, image-budget policy, and 404 fallback behavior are implemented and verified.

---

If needed, next step is converting this plan into exact files and workflows (`_layouts/*`, `assets/*`, `.github/workflows/*`, and Kit form include) with concrete code.
