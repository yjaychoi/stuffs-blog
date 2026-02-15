# Stuff of Thoughts - Detailed Design and Delivery Plan (English-Only)

**Domain:** `stuffs.blog`  
**Blog title (exact):** `Stuff of Thoughts`  
**Hosting:** GitHub Pages (Jekyll)  
**Email subscriptions:** Kit (newsletter/free plan)  
**Comments:** planned utterances integration (GitHub Issues-backed; spec defined, activation deferred)  
**Infrastructure boundary:** static GitHub Pages output + third-party Kit now, with utterances reserved for future activation (no custom backend/runtime)  
**Repo visibility:** private source repo (GitHub Plus) with GitHub Pages deployment via Actions  
**Localization scope:** none (English-only UI and posts)  
**Primary visual reference (required):** `mockup.html` in this repository is the canonical quality baseline for hierarchy, spacing rhythm, and component polish; screenshot captures are supplemental only. Visual determinism is satisfied by this canonical reference.

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
9. Allow high-fidelity, JS-enabled UI behavior (theme init, menu interaction, code-copy; comments reveal when future utterances phase is enabled) while keeping static hosting constraints.

### Non-goals

1. No custom backend.
2. No gratuitous animation loops or decorative-only effects that hurt readability/performance.
3. No dashboard widgets, side panels, carousels, or hero graphics.
4. No localization/i18n framework or multilingual routing.

---

## 2) Minimalist design guidelines

This section defines implementation guidance anchored to `mockup.html`.

### Required layout shape

1. One centered main column.
2. Simple top nav row with only essential links.
3. Text-first content blocks (about copy, tags, post links).
4. Minimal accent usage (prefer two accent roles); use the mockup's green/orange accents with neutral grays for supporting chrome.
5. Style must be codified by explicit token/layout/accessibility checks and visual-regression baselines tied to the canonical reference.

### Maximum UI surface area

1. Header control set must include: `Home`, `Blog`, `RSS`, `Subscribe`, and theme toggle.
2. Desktop (`>=1024px`): show `Home`, `Blog`, `RSS`, and `Subscribe` inline; theme toggle must be reachable.
3. Tablet (`640-1023px`): inline or disclosure-menu navigation is allowed; all controls must remain reachable by keyboard and touch.
4. Mobile (`420-639px`): disclosure-menu/hamburger patterns are allowed; include a visible menu control and theme toggle.
5. Narrow mobile (`<420px`): controls may wrap or collapse; avoid clipped/hidden controls and horizontal overflow.
6. No secondary content nav bars.
7. No persistent sidebars on mobile.
8. No card-heavy grids for the post index.
9. No oversized hero section on index page.

### Interaction contract (JS-enabled, progressive enhancement)

1. JavaScript is a first-class part of the design system and may drive:
   1. theme bootstrap and user preference persistence
   2. responsive/disclosure navigation
   3. code-block copy interactions
   4. comments lazy-load interactions (future utterances phase)
   5. small purposeful motion (e.g., hover/focus/state transitions)
2. JS-dependent controls must have accessible semantics (`button`, `aria-expanded`, `aria-controls`, keyboard support).
3. If JS fails, content reading must still work (header brand/home link, article body, footer links, and subscribe route remain discoverable), but parity with enhanced interactions is not required.
4. Any enhancement script must be small, deterministic, and covered by CI behavior tests.

### Canonical quality bar (required)

1. `mockup.html` defines the minimum acceptable visual hierarchy and polish for post detail pages.
2. “Minimalist” means restrained surface area, not low-fidelity UI; typography rhythm, spacing cadence, and component chrome must feel editorial and intentional.
3. Implementations that are functionally correct but visually flat, weakly tiered, or wireframe-like fail design acceptance.

### Forbidden elements

1. Social feed embeds.
2. Animated background effects.
3. Accent systems with more than two accent roles.
4. Overly broad rainbow accent systems that overpower content hierarchy.
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

### 4.1 Markdown header and metadata contract (required)

1. Every authored content file must start with a YAML front matter header at byte 0 and use exact `---` delimiters.
2. Required keys for post content are `layout`, `post_uid`, `slug`, `title`, `date`, `tags`, and `summary`.
3. Metadata quality constraints:
   1. `summary` is the default source for meta description and RSS excerpt, target length `120-180` characters.
   2. `tags` must be lowercase, deduplicated, and deterministic (stable order in source).
   3. `title` must be plain text (no HTML tags).
4. Optional keys (allowlisted):
   1. `description` (explicit meta description override)
   2. `cover_image` (canonical social/share image path)
   3. `cover_image_alt` (required when `cover_image` is present)
   4. `last_modified_at` (`YYYY-MM-DD HH:MM:SS +/-TTTT`)
5. Forbidden keys inside post front matter:
   1. `permalink`
   2. `redirect_from`
   3. arbitrary, undocumented top-level keys not present in the allowlist

### 4.2 Markdown heading/body contract (required)

1. Post title comes from front matter `title`; Markdown body must not contain an additional `# H1` heading.
2. Heading structure must be hierarchical (`h2` -> `h3` -> `h4`) without skipping levels by more than one tier.
3. Duplicate heading text in one document must use explicit IDs to keep anchor links deterministic.
4. Heading IDs must remain stable across builds (kramdown `auto_ids` policy, deterministic slug generation).

### 4.3 Markdown authoring compatibility

1. Authoring format is Markdown + Liquid; MDX components/import syntax are not allowed in Jekyll source content.
2. Supported content primitives:
   1. fenced code blocks (including language-tagged fences)
   2. fenced Mermaid diagrams using triple-backtick `mermaid` blocks
   3. standard Markdown images (`![alt](/assets/... "optional title")`)
   4. optional Liquid include helpers for richer media (`{% include markdown-image.html ... %}`)
3. Inline HTML is allowed only for semantic content markup required by posts; script tags inside post bodies are forbidden.

### 4.4 Embedded image authoring contract (required)

1. Preferred image path convention mirrors post slugs: `/assets/blog/<slug>/<file>` (or equivalent stable static path).
2. Standard Markdown image syntax is allowed for simple images.
3. Rich image rendering (caption/intrinsic sizing/zoom hook) must use include helper:
   1. `{% include markdown-image.html src="..." alt="..." width="..." height="..." caption="..." %}`
4. Include-helper requirements:
   1. `src`, `alt`, `width`, and `height` are required for non-decorative images.
   2. `caption` is optional.
   3. output must use semantic `<figure>` and `<figcaption>` when caption is provided.
5. External images are allowed only for hosts listed in `_data/external_asset_hosts.yml`; unlisted hosts fail CI.

---

## 5) Visual system

## 5.1 Typography

### Heading/title stack

1. Primary: `Courier Prime` (self-hosted or provider-hosted).
2. Fallbacks: `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, `monospace`.

### Body stack

1. Primary: `Noto Sans KR`.
2. Fallbacks: `system-ui`, `-apple-system`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial`, `sans-serif`.

### Font loading and performance

1. Font loading must use `font-display: swap` behavior (via `@font-face` or provider configuration).
2. If self-hosting, provide subset files using `unicode-range` to reduce first paint cost.
3. Preload only self-hosted fonts used above the fold on first view; avoid unnecessary preload of third-party hosted fonts.
4. CI must enforce first-view font budgets for critical routes (before caching), independent of hosting strategy:
   1. critical routes (`/`, `/blog/`, one post): <= `350KB` combined WOFF2 transfer.

### Type scale

1. Desktop:
   1. Site title: `36-46px`
   2. Section title: `24-32px`
   3. Post title: `44-52px` (canonical post-detail route), `34-42px` (other routes)
   4. Body: `17-19px`
2. Mobile:
   1. Site title: `28-34px`
   2. Section title: `22-26px`
   3. Post title: `34-40px` (canonical post-detail route), `28-34px` (other routes)
   4. Body: `16-18px`

### Editorial hierarchy lock values (post detail, required)

1. Desktop (`>=1024px`) lock values:
   1. metadata row: `11-12px`, uppercase, letter spacing `>=0.12em`, muted tone
   2. post title: `44-52px`, weight `700`, line-height `1.1-1.2`
   3. lead/body paragraphs: `28-34px` line-height with `17-19px` size equivalent
   4. section heading `h2`: `24-32px` equivalent with clear top spacing step-up from body
   5. subsection heading `h3`: `20-24px` equivalent
   6. content measure: `62-72ch`
2. Mobile (`<640px`) lock values:
   1. metadata row: `10-11px`, uppercase, readable tracking
   2. post title: `34-40px`, weight `700`, line-height `1.1-1.2`
   3. body paragraphs: `16-18px` with line-height `1.65-1.85`
   4. heading reductions preserve tier gaps (title > h2 > h3 > body) without collapsing into near-equal sizes
3. Hierarchy invariants:
   1. each tier transition (meta -> title -> lead/body -> h2/h3 -> support text) must be obvious in both size and spacing, not color-only
   2. no adjacent tiers may differ by less than `10%` effective size on desktop or `8%` on mobile

## 5.2 Theme system (light + dark required)

Both themes must preserve minimalist look and readability.

### Palette guidance (mockup-aligned)

1. The visual direction is Monokai-inspired, but neutral grays are allowed for borders, muted text, and surfaces as used in `mockup.html`.
2. Accent role mapping (preferred):
   1. `--accent` = chrome emphasis (green): nav-active states, metadata markers, UI chrome highlights.
   2. `--accent-alt` = in-article/subscription emphasis (orange): prose links and subscribe-related actions.
3. Core text/surface roles should prioritize readability over strict palette locking.
4. Code blocks may use the darker Monokai "ink" variants in light mode for contrast while preserving Monokai feel.
5. Token values in this section are implementation guidance, not hard palette lock constraints.

### Light mode tokens

1. `--bg: #f8f8f2`
2. `--surface: #f3f1e8`
3. `--surface-subtle: #ffffff`
4. `--text: #272822`
5. `--muted-text: #6b7280`
6. `--border: #d1d5db`
7. `--accent: #6f9020`
8. `--accent-alt: #c77418`

### Dark mode tokens

1. `--bg: #272822`
2. `--surface: #1e1f1c`
3. `--surface-subtle: #272822`
4. `--text: #f8f8f2`
5. `--muted-text: #9ca3af`
6. `--border: #374151`
7. `--accent: #a6e22e`
8. `--accent-alt: #fd971f`

### Theme behavior

1. Default follows `prefers-color-scheme`.
2. User toggle persists to `localStorage.stuffs_theme`.
3. Toggle is compact text or icon button in header.
4. No theme transition animation longer than `150ms`.
5. If `localStorage` is unavailable, theme still follows `prefers-color-scheme` and toggle works for the current page session without uncaught errors.

## 5.3 Minimal component styling rules

1. In long-form content, links must use `--accent-alt` (orange) as the accent treatment (text, underline, or both) while preserving required contrast.
2. Tag chips are flat rectangles with subtle border/background.
3. Buttons use thin border and no heavy fills by default.
4. Shadows are either none or very subtle.
5. Rounded corners are low (`2-6px` range).
6. Use `--accent` (green) for UI chrome and navigation emphasis; use `--accent-alt` (orange) for in-article links and subscribe-related actions.
7. For text below large-text thresholds, apply accent via underline/border/marker while keeping glyph color at `--text` or `--muted-text` unless measured contrast is `>= 4.5:1`.
8. In dark theme, `#75715e` is reserved for borders/dividers/chrome and must not be used as paragraph-scale glyph color.

## 5.4 Post code block highlighting (Monokai required)

1. Embedded code in post bodies (fenced blocks and Liquid `highlight` blocks) must render with Monokai syntax highlighting in both site themes.
2. Syntax highlighting must use a real highlighter integration and plugin pipeline, not manual token spans:
   1. Jekyll baseline: `rouge` for fenced/Liquid blocks with line numbers enabled through formatter/config.
   2. Reference implementation pattern: `/website/astro.config.mjs` uses `astro-expressive-code` + `@expressive-code/plugin-line-numbers` (Shiki-backed).
   3. Hand-authored per-token markup inside post content/templates is forbidden.
3. Language coverage must be broad out of the box (at minimum): `bash`, `c`, `cpp`, `csharp`, `css`, `diff`, `go`, `graphql`, `html`, `java`, `javascript`, `json`, `kotlin`, `markdown`, `php`, `python`, `ruby`, `rust`, `sql`, `swift`, `toml`, `typescript`, and `yaml`.
4. Required code tokens:
   1. surfaces/foreground: `--code-bg-light: #f8f8f2`, `--code-fg-light: #272822`, `--code-bg-dark: #272822`, `--code-fg-dark: #f8f8f2`
   2. shared comment token: `--code-comment: #75715e`
   3. dark-mode syntax tokens: `--code-keyword-dark: #f92672`, `--code-string-dark: #e6db74`, `--code-number-dark: #ae81ff`, `--code-function-dark: #a6e22e`, `--code-type-dark: #66d9ef`, `--code-meta-dark: #fd971f`
   4. light-mode syntax tokens (darker Monokai ink variants for contrast): `--code-keyword-light: #a31955`, `--code-string-light: #7a6a28`, `--code-number-light: #5f3c99`, `--code-function-light: #6f9020`, `--code-type-light: #1f5d73`, `--code-meta-light: #c77418`
5. Code blocks must include visible line numbers generated by the highlighter/plugin output (`rouge` linenos or equivalent plugin behavior), not by hand-authored HTML.
6. Code block chrome includes a compact language/filename label row and copy button, styled minimally.
7. Inline code uses a muted surface treatment and must remain visually distinct from links.
8. Code theme treatment should remain Monokai-inspired and visually consistent with `mockup.html`.
9. Accessibility policy for code:
   1. `--code-fg-light` and `--code-fg-dark` must each meet WCAG AA against their respective code backgrounds.
   2. Syntax token colors follow a separate policy from body text and must maintain at least `3:1` against the active code background.
   3. Syntax meaning must not rely on color alone; weight/italic/underline or token category structure must remain present.
   4. Accessibility gates must treat code-token contrast policy and body-text AA policy as separate checks to avoid conflicting outcomes.

## 5.4.1 Mermaid diagram rendering (required)

1. Authoring format for diagrams is fenced Markdown blocks using `mermaid` language fences.
2. Runtime implementation contract (Jekyll-compatible):
   1. include a self-hosted Mermaid runtime in `assets/js/vendor/mermaid.min.js` (or equivalent pinned local bundle).
   2. include `assets/js/mermaid-init.js` to transform Mermaid code fences into render targets and render SVG output.
   3. process unrendered Mermaid blocks idempotently (`data-processed` guard) on `DOMContentLoaded`.
3. Theme contract:
   1. Mermaid theme must follow active site theme (light/dark parity).
   2. Diagram text and stroke colors must preserve readability in both themes.
4. Fallback and failure behavior:
   1. if JS is unavailable, Mermaid source remains visible as a readable code block.
   2. if Mermaid render fails, preserve readable source/fallback state and avoid blank containers.
5. Layout behavior:
   1. rendered diagrams must fit content width and never force page-level horizontal overflow.
   2. oversized diagrams must scroll within local containers on small screens.

## 5.5 Asset and image performance budgets

1. Critical CSS budget (home/blog/post route first view, gzip): <= `60KB`.
2. Critical JS budget (theme + code-copy + optional comments loader, gzip): <= `60KB`.
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
6. Mermaid payload policy:
   1. Mermaid runtime must be loaded only on pages that contain Mermaid diagrams.
   2. Mermaid JS payload budget (gzip) is capped at `<= 350KB` for the optional route-level bundle.
   3. CI fails if Mermaid runtime is included on routes with no Mermaid diagrams.

## 5.6 High-fidelity page spec contract

1. Page-level design specs must be explicit enough to reproduce a polished implementation without guesswork.
2. For the canonical post-detail route (the `mockup.html` benchmark), the spec must define:
   1. typography roles (font family, weight, scale, line-height)
   2. color-token mapping by component state (default/hover/focus/active/disabled)
   3. layout values (container widths, spacing scale, and breakpoint behavior)
   4. interactive behaviors (menu state transitions, copy action feedback, comments placeholder/reveal behavior)
   5. component chrome details (metadata row, section dividers, code-toolbar row, prev/next block style, comments placeholder state)
3. For other major routes (`/`, `/blog/`, `/tags/`, `/subscribe/`), route-level specs may inherit shared tokens/components and only need route-specific deltas that affect hierarchy, spacing cadence, or interaction behavior.
4. Visual detail must be at least equal to the canonical reference quality bar; wireframe-level or merely utilitarian styling is non-compliant.
5. Visual determinism is achieved by mapping route fixtures directly to `mockup.html`; no additional screenshot-style interpretation layers are required.
6. CI and review checklists must validate behavior/state coverage, not only static structure.

## 5.7 Canonical composition spec (post detail, required)

1. The post-detail route is the canonical visual benchmark.
2. Composition and chrome decisions in this section must map directly to `mockup.html` as source of truth.
3. Required desktop composition order and spacing rhythm:
   1. header/nav block with bottom divider
   2. metadata line
   3. large title block
   4. short accent rule under title
   5. long-form article body
   6. code panel with toolbar row (filename/language + copy action)
   7. previous/next navigation split block
   8. bottom-of-article subscribe form block
   9. comments placeholder/shell block
   10. footer divider and legal line
4. Required chrome details:
   1. code panel uses a visibly distinct theme-aware surface (light surface in light mode, dark surface in dark mode) with subtle border, small radius, and internal scroll affordance
   2. copy control has icon/text feedback states and keyboard-visible focus styling
   3. previous/next block uses muted direction labels plus stronger linked-title typography
   4. comments area includes neutral surface container and loading/skeleton placeholder
   5. accent rule under title is short and emphatic (`80-120px` width, `3-4px` thickness)
5. Required spacing cadence:
   1. large transitions between major sections (`>=48px` desktop, `>=32px` mobile)
   2. medium transitions inside sections (`16-32px`)
   3. tight utility spacing only for metadata/chrome (`4-12px`)
6. Motion and state requirements:
   1. hover/focus transitions are subtle (`120-180ms`), never bouncy
   2. no layout-jumping transitions for nav, title, or article flow
   3. state changes (active nav, copy success, menu open, comments reveal) must be visually explicit

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
   1. Inline layout or disclosure menu is allowed.
   2. If disclosure menu is used, open/close states must be keyboard accessible and visually clear.
3. Mobile:
   1. Controls may wrap or collapse into disclosure menu patterns.
   2. Header must not introduce horizontal scrolling.
   3. Menu trigger touch target must be at least `44px`.
4. Enhancement fallback requirement:
   1. With JS unavailable, core reading flow and global recovery links (`Home`, `Blog`) remain available somewhere in the page shell.

## 6.4 Content behavior

1. Post list remains one-column on all breakpoints.
2. Code blocks scroll horizontally on mobile.
3. Touch targets minimum `44px` height for tappable controls.
4. Font sizes never below `16px` body on mobile.
5. Post body images must reserve layout space (`width`/`height` or `aspect-ratio`) to prevent CLS.
6. Non-critical images must use lazy loading; above-the-fold images may opt out.
7. Every content image must include appropriate `alt` text (`alt=""` only for decorative images).
8. Embedded Markdown images and include-based figures must scale to content width (`max-width: 100%`, `height: auto`) without distortion.
9. Mermaid diagrams must never create page-level horizontal overflow; horizontal scroll is allowed inside diagram containers.
10. If Mermaid rendering fails client-side, the page must still show readable diagram source text.

---

## 7) Page-level component specs

## 7.1 Home (`/`)

### Required blocks (top to bottom)

1. Minimal nav/header.
2. One short about paragraph.
3. Latest posts list (reverse-chronological, no year grouping, maximum `5` items).

### Visual detail requirements

1. About paragraph:
   1. width target `55-68ch` desktop, `90-100%` container on mobile
   2. clear separation from latest-post list via medium section spacing (`24-40px`)
2. Latest-post row styling:
   1. date uses muted text token; title uses stronger weight and default text token
   2. hover state uses chrome accent (`--accent`) on title/marker without shifting layout
3. List rhythm:
   1. row spacing must support scanability (`12-20px` vertical gap)
   2. no card container chrome beyond subtle separators

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

### Visual detail requirements

1. List item hierarchy:
   1. title remains dominant text in each row
   2. date/tags remain secondary and visually quieter
2. Tag presentation:
   1. tags use chrome accent (`--accent`) sparingly (marker/border/text treatment)
   2. tags must not overpower post-title readability
3. Pagination controls:
   1. use chrome accent on hover/focus
   2. maintain stable alignment across page counts

## 7.3 Post detail

1. Meta line:
   1. includes date (`MMM d, yyyy`) and reading time (optional override)
   2. compact uppercase treatment with widened tracking
   3. metadata separators and active tag accent must be visible without dominating title/body
2. Title block:
   1. uses locked hierarchy values from section 5.1
   2. must visually dominate the viewport above the fold
   3. includes a short accent rule below title
3. Body content:
   1. readable editorial measure (`62-72ch` desktop)
   2. paragraph spacing and line-height tuned for sustained reading
   3. `h2`/`h3` spacing must clearly reestablish hierarchy after dense paragraphs
4. Code experience:
   1. code blocks with copy action, Monokai syntax highlighting, and highlighter-generated line numbers
   2. visible toolbar row (filename/language label + copy control)
   3. horizontal overflow handled without clipping on mobile
5. Post-navigation block:
   1. previous/next links follow chronological order
   2. direction labels are muted and linked titles are typographically stronger
6. Comments block (current + future contract):
   1. current release must render an intentional placeholder/shell block on post pages
   2. utterances activation is deferred; future behavior is specified in section 13
7. Bottom-of-article subscribe form (required):
   1. include the actual Kit-managed subscribe form embed (or `subscribe-form.html` wrapper around that embed) at the end of each post detail page (not just a link/CTA)
   2. form appears below article content and post-navigation, before footer
   3. form styling may be compact but must preserve privacy/unsubscribe copy

## 7.4 Tags page

1. Alphabetical full list.
2. Clicking tag must navigate to canonical tag route pages (`/tags/<tag-slug>/`), not ad-hoc anchors.
3. Full-list ordering must use deterministic `en-US` collation; if ICU collation is unavailable, fallback sort must be deterministic and contract-tested.
4. Tag slug contract:
   1. default slug is generated from normalized tag text (NFKC -> lowercase -> hyphenated slug).
   2. explicit overrides live in `_data/tag_slugs.yml` for ambiguous or colliding cases.
   3. CI fails on slug collisions.

### Visual detail requirements

1. Tag list uses compact textual presentation with restrained chrome.
2. Tag links use in-article accent strategy (`--accent-alt`) only on link treatment; supporting metadata remains neutral.
3. Dense tag lists must maintain readable line wrapping with consistent row gaps.

## 7.5 Subscribe page

1. Short value proposition.
2. Kit HTML form POST integration (no third-party form embed script).
3. Privacy line (`unsubscribe anytime`).
4. Minimal confirmation/success messaging.
5. Success uses dedicated status route (`/subscribe/success/`).
6. Error handling may use optional `/subscribe/error/` route when supported by provider; otherwise keep concise inline recovery copy on `/subscribe/`.

### Visual detail requirements

1. Primary subscribe action uses `--accent-alt` (orange) for border/text/hover treatment; when small-text contrast would fail, keep glyph color at `--text` and apply orange via border/underline/background emphasis.
2. Ancillary chrome (dividers, info markers, subtle highlights) uses `--accent` (green) sparingly.
3. Form layout must prioritize clarity:
   1. single dominant email input
   2. one primary submit action
   3. privacy line grouped directly with form controls

## 7.6 Privacy page

1. Explains data processing for Kit form submissions and planned utterances comments.
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
7. Header/menu controls are keyboard reachable at every breakpoint, including disclosure-menu states.
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
10. Metadata derivation policy (deterministic):
   1. `<title>` and primary social title derive from front matter `title`.
   2. description derives from `description` when present, otherwise `summary`.
   3. `cover_image` (when present) is used for OG/Twitter image; otherwise route fallback image policy applies.
   4. `last_modified_at` (when present) must emit matching structured metadata and machine-readable timestamp.

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
    mermaid-loader.html
    markdown-image.html
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
    js/mermaid-init.js
    js/vendor/mermaid.min.js
    fonts/ (optional when self-hosting)
      CourierPrime-Regular.woff2
  package.json
  vitest.config.ts
  playwright.config.ts
  size-limit.config.cjs
  tests/
    contracts/
      front_matter.spec.ts
      markdown_content.spec.ts
      permalink.spec.ts
      redirects.spec.ts
      tags.spec.ts
      seo.spec.ts
      feed.spec.ts
      static_constraints.spec.ts
      mermaid_rendering.spec.ts
      image_embed.spec.ts
      code_highlighting.spec.ts
      visual_hierarchy_tokens.spec.ts
      comments_config.spec.ts
      font_budget.spec.ts
      asset_budget.spec.ts
      theme_contrast.spec.ts
      kit_config.spec.ts
    e2e/
      smoke.spec.ts
      no_js.spec.ts
      mermaid.spec.ts
      comments_disabled.spec.ts
      comments_utterances.spec.ts
      visual_regression.spec.ts
      accessibility.spec.ts
  docs/
    moderation.md
```

---

## 11) Deployment pipeline (required)

## 11.0 Static hosting constraints (GitHub Pages)

1. Final deploy artifact must be static files only (`HTML`, `CSS`, `JS`, assets).
2. No custom server runtime, API, or middleware is allowed.
3. Dynamic behavior is limited to client-side JS and third-party embeds (theme/menu/copy interactions, Mermaid client-side rendering, Kit form post; utterances script only when `comments.provider=utterances`).
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
2. Front matter, markdown-header, and permalink validation (`tests/contracts/front_matter.spec.ts`, `tests/contracts/markdown_content.spec.ts`, `tests/contracts/permalink.spec.ts`):
   1. checks required fields (`post_uid`, `title`, `date`, `tags`, `summary`)
   2. validates `date` format includes timezone offset (`YYYY-MM-DD HH:MM:SS +/-TTTT`)
   3. validates `post_uid` format and uniqueness
   4. validates metadata allowlist (required/optional keys) and fails unknown forbidden top-level front matter keys
   5. validates body heading contract (no duplicate `h1`, no malformed heading hierarchy, deterministic duplicate-heading IDs)
   6. fails any manual `permalink` override
3. Static constraint validation:
   1. fails if templates introduce internal API calls or server-only dependencies
   2. validates Mermaid and embedded media contracts (`tests/contracts/mermaid_rendering.spec.ts`, `tests/contracts/image_embed.spec.ts`) including fallback behavior, host allowlists, and required image attributes
4. HTML/link/SEO checks:
   1. no broken internal links
   2. key pages exist (`/`, `/blog/`, `/tags/`, `/subscribe/`, `/subscribe/success/`, `/privacy/`, `/feed.xml`, `/404.html`)
   3. canonical tags are present and consistent
   4. blog pagination canonicalization policy is enforced (`/blog/page/1/` normalization and page `>=2` self-canonical)
   5. RSS endpoint returns valid XML
   6. `url`, `baseurl`, and `CNAME` values are consistent with `https://stuffs.blog`
   7. page metadata mapping (`title`, `description/summary`, `cover_image`, optional `last_modified_at`) is present and deterministic
5. UI smoke tests (Playwright):
   1. desktop viewport (`1366x900`) with light/dark toggle
   2. mobile viewport (`390x844`) with light/dark toggle
   3. asserts no horizontal overflow and header/menu controls remain reachable
6. Progressive-enhancement smoke tests:
   1. JS enabled: validates disclosure-menu interaction, theme persistence, code-copy behavior, Mermaid rendering on diagram posts, and comments behavior only when `comments.provider=utterances`.
   2. JS disabled: validates fallback reading flow and recovery links (`Home`/`Blog`) on `/`, `/blog/`, `/tags/`, `/subscribe/`, and `/privacy/`.
7. Comments-mode validation (required):
   1. run with `comments.provider=none` (default): placeholder renders, no utterances script/frame requests, privacy disclosure present
   2. run with `comments.provider=utterances`: explicit `Show comments` control renders and lazily injects utterances only after user action
   3. verify no duplicate utterances mounts on repeated interactions and keyboard activation works (`Enter`/`Space`)
   4. verify no utterances network/script/frame activity occurs before explicit user action in `provider=utterances` mode
   5. CI must stub/intercept utterances host traffic (`utteranc.es`, `github.com`, `api.github.com`) and run fully deterministic without external network dependency
   6. production utterances activation remains optional in current release
8. Visual hierarchy regression (Playwright snapshots, required):
   1. compares canonical post fixture route (derived from `mockup.html`) in desktop (`1366x900`) and mobile (`390x844`)
   2. checks both light and dark themes
   3. diff threshold hard cap: `<= 0.8%` pixel delta per snapshot
   4. canonical fixture route must use deterministic content derived from `mockup.html` with stable rendering harness settings (fixed viewport, locale, timezone, and test tooling versions)
   5. snapshot harness disables non-essential animation and time-variant effects to prevent flaky diffs
   6. fails if title prominence, section spacing cadence, code-panel chrome, prev/next block, or comments shell diverges from baseline capture
9. Accessibility audit (axe-core or equivalent):
   1. scans `/`, `/blog/`, `/tags/`, one post page, `/subscribe/`, and `/privacy/` in light and dark themes
   2. fails on WCAG AA contrast (excluding code syntax token policy), keyboard-focus regressions, and missing accessible names
10. Code and palette validation:
   1. validates that post code blocks use the configured highlighter pipeline and include language context, copy action hooks, and highlighter-generated line numbers
   2. validates that source content/templates do not include hand-authored per-token syntax spans
   3. validates theme readability/contrast for primary text, controls, and code surfaces in both light and dark modes
   4. validates visual consistency with the canonical mockup (accent usage, code-panel treatment, and state styling)
11. Hierarchy token contract validation (`tests/contracts/visual_hierarchy_tokens.spec.ts`):
   1. enforces required typography/spacing tiers from sections 5.1 and 5.7
   2. fails if key post-detail selectors collapse hierarchy gaps below thresholds
12. Kit config validation:
   1. subscribe page contains Kit form include
   2. post detail layout/pages contain bottom-of-article Kit form embed (or include wrapper)
   3. required config values are present
   4. `success_url` is absolute `https://stuffs.blog/...` and route-matched
   5. if `error_url` is configured, it must be absolute `https://stuffs.blog/...` and route-matched
13. Tag/slug/redirect validation:
   1. fails on tag slug collisions
   2. redirect mappings are duplicate-free and syntactically valid
14. Performance and cache validation:
   1. enforce first-view font budget from section 5.1
   2. enforce CSS/JS/image budgets from section 5.5 using `size-limit` (CSS/JS) plus deterministic Vitest file-size checks (images/fonts)
   3. enforce Mermaid route-level payload budget and on-demand loading policy from section 5.5
   4. fail if critical CSS/JS/font references omit configured cache-busting strategy
15. Workflow baseline hardening:
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
   4. one Mermaid-enabled post route probe confirms Mermaid containers are rendered or readable fallback is present
   5. desktop and mobile smoke probes succeed
   6. JS-disabled fallback probes on `/`, `/tags/`, and `/privacy/` succeed
   7. page-1 canonicalization checks pass (`/blog/page/1/` non-indexable and normalized)
   8. unknown-route probe returns `404` and renders readable fallback copy
   9. canonical post-detail visual-regression snapshots (desktop/mobile, light/dark) pass against the approved baseline

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
3. Include `subscribe-form.html` on:
   1. `/subscribe/` page
   2. bottom of every post detail page (`post.html`) as a compact variant
4. Use direct HTML `<form action="https://app.kit.com/forms/.../subscriptions">` submission; do not load external Kit embed scripts.
5. Keep copy minimal.

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
3. CI fails if any post detail page/layout omits the bottom-of-article form include.
4. CI fails if form action URL is not on Kit host allowlist.
5. CI fails if `success_url` is not absolute `https://stuffs.blog/...`; if `error_url` exists, it must also be absolute `https://stuffs.blog/...`.
6. CI fails if external Kit embed scripts are added.
7. Manual QA verifies:
   1. successful subscription flow
   2. confirmation email delivery
   3. unsubscribe works
   4. bottom-of-article subscription form works on at least one post detail page
   5. one feed-driven or manual post notification send succeeds

---

## 13) Comments integration (utterances)

Status: deferred live activation. Current release does not require production utterances enablement, but does require deterministic provider-mode contract/e2e coverage (with stubbed utterances traffic) so future activation is safe.

1. Activation/config contract (required):
   1. `_config.yml` must define:
      1. `comments.provider` with allowed values: `none`, `utterances`
      2. `comments.provider` default: `none`
      3. when `utterances`, require `comments.utterances.repo` and `comments.utterances.issue_term`
   2. templates/scripts must branch behavior only from `comments.provider` to keep tests deterministic
2. Current release contract (`comments.provider=none`):
   1. post pages render a comments placeholder/shell block that preserves layout and hierarchy
   2. no utterances script/frame loads occur
   3. privacy page discloses planned third-party comment processing
3. Future utterances activation contract (`comments.provider=utterances`):
   1. store comments in a dedicated public repo
   2. embed only on post pages
   3. theme must follow active site theme (light/dark variants)
   4. if utterances unavailable, page content still fully readable
   5. load utterances lazily only after explicit user action (`Show comments`); do not auto-load on viewport entry
   6. show a short privacy note near comments indicating third-party GitHub Issues-backed processing
4. Testing requirements (required):
   1. contract tests (`comments_config.spec.ts`) validate:
      1. allowed values for `comments.provider` (`none`, `utterances`)
      2. default `comments.provider=none`
      3. required utterances keys (`repo`, `issue_term`) when `provider=utterances`
      4. failure on invalid provider values or incomplete utterances config
   2. e2e tests (`comments_disabled.spec.ts`) validate in `provider=none`:
      1. comments placeholder/shell is rendered on post pages
      2. no utterances script injection
      3. no utterances iframe mount
      4. no utterances host network activity
   3. e2e tests (`comments_utterances.spec.ts`) validate in `provider=utterances`:
      1. `Show comments` control is present with accessible name and keyboard activation (`Enter`/`Space`)
      2. utterances resources are not requested before explicit user action
      3. one user action injects exactly one utterances mount
      4. repeated actions do not create duplicate mounts
      5. fallback copy remains readable if utterances load fails
   4. accessibility tests validate comments control names, focus order, and state announcement behavior in both provider modes
   5. `provider=utterances` CI tests must use stubbed/intercepted utterances responses and must not depend on production comment activation
5. On GitHub Pages, include a restrictive meta CSP and referrer policy compatible with Kit and utterances:
   1. baseline CSP allowlist must explicitly constrain `default-src`, `script-src`, `style-src`, `img-src`, `frame-src`, `connect-src`, `font-src`, `form-action`, and `base-uri`.
   2. allowlist host scope must be minimum-required (`self`, `app.kit.com`, `utteranc.es`, `github.com`, `api.github.com`, `avatars.githubusercontent.com`) plus explicitly declared external asset hosts from `_data/external_asset_hosts.yml` when needed.
   3. Mermaid runtime must be self-hosted (`self`) by default; adding CDN/script hosts for Mermaid requires an explicit security exception and documentation update.
   4. referrer policy must be `strict-origin-when-cross-origin`.
6. Meta CSP is defense-in-depth only (not equivalent to response-header CSP); this residual risk must be documented in launch notes.
7. If fronted by a proxy/CDN later, enforce equivalent or stricter header-based CSP/referrer-policy at the edge.
8. Operational policy:
   1. define comment moderation owners and response SLA in `docs/moderation.md`.
   2. privacy request workflow includes comment deletion handling and links users to contact channel on `/privacy/`.

---

## 14) Quality checklist (definition of done)

A release is done only if all items pass.

1. Header controls follow the breakpoint matrix in section 2/6, with no horizontal overflow at required smoke viewports `1366x900` and `390x844` (plus manual verification at `768x1024` and `360x780`).
2. Mobile layout remains one-column and readable without overlap.
3. Light and dark themes pass automated WCAG AA checks for body/UI text with zero critical/serious keyboard-focus failures; code syntax tokens pass section 5.4 policy.
4. Text-role tokens (`--text`, `--muted-text`, `--tag-text`) pass AA contrast validation in both themes.
5. JS-enabled interactions (menu/theme/copy, Mermaid render on diagram posts, and comments only when enabled) work at required smoke viewports; JS-disabled fallback reading flow still works for core routes.
6. Mermaid fences render to readable SVG output in both themes and do not cause page-level horizontal overflow.
7. Mermaid failure and no-JS states preserve readable source fallback (no blank content blocks).
8. Embedded Markdown images and include-based figures render responsively, preserve intrinsic sizing, and do not cause CLS regressions.
9. Content-image `alt` requirements are enforced and CI rejects missing/invalid alt usage.
10. Front matter and markdown heading contracts are enforced (required keys, allowlisted optionals, no in-body duplicate H1 behavior, stable heading IDs).
11. Metadata mapping is deterministic (`title`, `description/summary`, optional `cover_image`, optional `last_modified_at`) across rendered pages and feeds.
12. Subscribe form works end-to-end with success handling and clear error fallback behavior.
13. Bottom-of-article subscribe form is present and working on post detail pages.
14. Kit feed-based notification flow is configured and tested.
15. CI and deploy workflows are green; production smoke checks pass with retry/backoff.
16. Comments placeholder/privacy disclosures are present; provider-mode tests (`none` and `utterances`) pass in CI with stubbed utterances traffic (no production activation dependency).
17. Post code blocks use Monokai highlighting with copy action and highlighter-generated line numbers in both site themes (no hand-authored token markup).
18. Blog visual language remains aligned with `mockup.html`, using green/orange accents with neutral supporting tones.
19. Header and code-copy controls pass keyboard and screen-reader interaction checks.
20. Home latest-post list and other list outputs are reproducible for the same content set (deterministic `SITE_BUILD_DATE_UTC` policy).
21. Canonical visual-regression baselines are versioned and approved for post detail (desktop/mobile, light/dark), and CI pixel-diff thresholds pass.
22. `404.html` provides readable fallback copy and unknown routes return `404`.
23. Blog pagination canonicalization policy is enforced (`/blog/page/1/` normalization and page `>=2` self-canonical behavior).
24. Feed strategy is valid (`/feed.xml`) and nav links route correctly.
25. Workflow baseline hardening gates pass (least-privilege permissions and pinned action versions).
26. Comment moderation/deletion operational policy is documented and linked from privacy route.
27. Visual hierarchy token-contract tests pass with no tier-collapse regressions.
28. Accent-role mapping remains consistent with mockup intent: green for chrome, orange for in-article links and subscribe actions.

---

## 15) Execution roadmap (adjustable)

Phase order and individual tasks in this roadmap are implementation guidance and may be reordered, merged, or simplified as needed while preserving the product goals.

## Phase 0 - foundation

1. Create file structure and base layouts.
2. Add typography delivery and font-loading strategy (`font-display`, optional subset plan when self-hosting), and CSS token system.
3. Implement minimal header/footer shells and add `CNAME`.
4. Add route-generation foundation (`jekyll-paginate-v2`) and page-1 canonicalization strategy.
5. Add canonical post-detail fixture content used for deterministic visual hierarchy tests.
6. Add CI skeleton early so each subsequent phase is validated incrementally.

## Phase 1 - core UI and responsiveness

1. Build home/blog/post/tags/subscribe layouts (home = about paragraph + latest posts list, no year grouping).
2. Implement responsive rules for mobile/tablet/desktop.
3. Add `privacy` page.
4. Match the minimalist spacing and typography contract.
5. Implement responsive header/menu behavior (inline or disclosure by breakpoint) and verify keyboard + fallback behavior.
6. Match canonical post-detail composition/chrome requirements from section 5.7.

## Phase 2 - core content and theming

1. Enforce post front matter contract (`post_uid`, timezone-aware `date`, required core fields).
2. Enforce permalink strategy with immutable `slug` and simple static-redirect policy.
3. Implement markdown heading/body validation (no duplicate body `h1`, deterministic heading IDs).
4. Add light/dark toggle and persistence.
5. Enforce AA-safe text token usage rules and code-token contrast policy.
6. Add embedded image include/component pattern (`markdown-image.html`) with alt, intrinsic size, and caption behavior.
7. Implement Mermaid authoring/rendering pipeline (`mermaid` fenced blocks -> client render) with JS fallback handling.
8. Add tag slug validation.

## Phase 3 - integrations

1. Integrate Kit form and labels on both `/subscribe/` and bottom of post detail pages.
2. Integrate Kit RSS automation for new-post notifications.
3. Keep utterances integration spec-complete but deferred (placeholder + activation contract + privacy disclosures + provider-mode tests).
4. Wire privacy links and processor disclosures for subscription and planned comments.
5. Add restrictive meta CSP/referrer policy with documented GitHub Pages limitations.
6. Add comment moderation/deletion operations doc and contact workflow.

## Phase 4 - CI/CD and launch

1. Complete CI workflow checks (build, front matter/permalink, link/SEO, desktop+mobile smoke, progressive-enhancement smoke, comments-mode validation, visual regression, hierarchy token contract, accessibility audit, Kit config, slug/redirect validation, performance budgets).
2. Add deploy workflow to GitHub Pages with restricted `workflow_dispatch deploy_ref` (commit SHA from `main` ancestry only).
3. Configure branch protection and production environment.
4. Add workflow baseline hardening (pinned action versions and least-privilege permissions).
5. Require deploy-time revalidation of the exact target commit.
6. Add post-deploy smoke checks with retry/backoff, blog pagination canonicalization probes, visual-baseline probes, and single-flight deploy concurrency.
7. Version and approve baseline snapshots for canonical post detail before release.
8. Run smoke tests and publish.

---

## 16) Acceptance criteria (final)

1. Site is minimalist and conforms to the header/content constraints in sections 2 and 6.
2. Works on both PC and mobile with no broken layout or horizontal overflow in required smoke viewports.
3. Supports light mode and dark mode with persistent preference.
4. Is English-only (no localization or multilingual requirements).
5. CI/CD deploy pipeline is active, enforced, and includes desktop/mobile smoke checks, progressive-enhancement checks (JS-enabled behaviors + JS-disabled fallback), accessibility audit gates, and workflow hardening gates.
6. Canonical post-detail visual regression passes in desktop/mobile and light/dark snapshots within configured pixel-diff threshold.
7. Visual hierarchy token-contract gates pass, proving non-flat tiered typography/spacing comparable to `mockup.html`.
8. Post-detail page composition matches section 5.7 (title dominance, accent rule, body cadence, code chrome, prev/next block, comments shell).
9. Kit email integration is configured, validated, and tested with static-safe constraints and absolute redirect URLs (`success_url` required, `error_url` optional).
10. Bottom-of-article subscribe form is present and functional on post detail pages.
11. Kit new-post notifications are configured through RSS automation or validated manual fallback.
12. utterances integration is fully specified for future activation (placeholder behavior, provider switch contract, privacy linkage, operational moderation/deletion policy), and comments-mode tests pass for both `provider=none` and `provider=utterances` in a deterministic stubbed CI harness.
13. RSS strategy is implemented and validated (`/feed.xml`) with nav integration.
14. Permalink rules (immutable `slug`), blog page-1 canonicalization policy, and deterministic home latest-post computation are enforced by CI.
15. Front matter/metadata contracts are enforced, including allowlisted optional keys and deterministic metadata derivation (`title`, `description/summary`, optional `cover_image`, optional `last_modified_at`).
16. Markdown heading contract is enforced (`title` in front matter, no body-level duplicate `h1`, deterministic heading IDs).
17. Mermaid authoring via fenced Markdown `mermaid` blocks is supported and rendered client-side with theme parity.
18. Mermaid diagrams stay readable on mobile, do not introduce page-level overflow, and degrade gracefully to source text when JS/rendering fails.
19. Embedded Markdown images/include-based figures support responsive sizing, intrinsic dimensions, and alt-text requirements with CI enforcement.
20. Embedded post code uses enforced Monokai highlighting with highlighter-generated line numbers, and CI rejects non-compliant theme drift or hand-authored token markup while applying section 5.4 code-token accessibility policy.
21. Site-wide visual language remains mockup-aligned while text-role tokens remain readable and AA-compliant where applicable.
22. Deploy workflow can only deploy validated commits from `main` ancestry and re-validates target commits before release.
23. Tag slug collisions and redirect-file consistency are validated by CI.
24. Static asset cache-busting, image-budget policy, and 404 fallback behavior are implemented and verified.
25. Accent-role mapping is preserved in implementation and tests: green for chrome, orange for in-article links and subscribe actions.

---

If needed, next step is converting this plan into exact files and workflows (`_layouts/*`, `assets/*`, `.github/workflows/*`, and Kit form include) with concrete code.
