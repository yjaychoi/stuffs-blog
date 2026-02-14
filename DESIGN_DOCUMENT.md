# Stuff of Thoughts — Design Document (GitHub Pages + Jekyll + Kit Free)

**Domain:** `stuffs.blog`
**Blog title (exact):** **Stuff of Thoughts**
**Hosting:** GitHub Pages (Jekyll)
**Email subscriptions:** Kit (Newsletter / free plan) ([help.kit.com][1])
**Comments:** GitHub Issues–backed embed (utterances) ([GitHub][2])
**Repo visibility:** Private repo allowed (GitHub Pro) while Pages remains public ([GitHub Docs][3])
**DNS:** Cloudflare (registrar + DNS)
**Localization:** English (`en`) + Korean (`ko`)

---

## 1) Product goals

### Primary goals

1. **Write-first publishing**: new post = new Markdown file committed to GitHub.
2. **Minimal, opinionated UI**: one “page” experience with strong typography and calm navigation.
3. **Monokai visual identity**: dark-first, terminal-adjacent, with inline code that *immediately* reads as “Monokai.”
4. **No backend**: every feature must work as static hosting + third-party embeds only.
5. **Room to grow**: must support adding **LinkedIn + GitHub profile links later** without redesign.
6. **Localization-ready**: first release supports English and Korean without redesigning templates.

### Non-goals (explicitly not built now)

* Site search (can be added later as client-side search)
* Auto “new post → email blast” from RSS (Kit’s RSS campaigns are not on the free plan per pricing table) ([Kit][4])
* Non-GitHub-authenticated comments (no anonymous comments)

---

## 2) Target aesthetic (derived from the screenshots)

This design intentionally blends two moods shown in the screenshots:

### A. “Centered paper on a stage”

* A **single, centered content sheet** with a clear edge and soft shadow.
* The outer area feels like a **studio backdrop**: calm, matte, and slightly colored.
* The content sheet is **visually separated** with a border and subtle elevation, so the page reads like a “document” floating over the background.

### B. “Editorial terminal”

* Dark background, **high-contrast mono/serif type**, and minimal chrome.
* A thin accent rule under the title (editorial rhythm).
* Code sections look like “snippets dropped into a post,” with a label (“Code example”) and a “Copy” affordance.

### Signature details to implement

* **Oversized article title** with wide line-height and confident left alignment (no center titles).
* **Micro metadata line** above the title (date + tags), with tiny type and generous letter spacing.
* **Drop cap** on the first paragraph for long-form posts (optional but matches the vibe).
* **Right rail navigation** on wide screens (tags + “All posts”), but never “dashboard-y.”
* **A single accent color** that appears in:

  * link underlines,
  * the title rule,
  * hover highlights,
  * small UI affordances (“copy code”, tag hover).
* **Soft UI**: no heavy borders everywhere; use borders only to define the “sheet,” code blocks, and small chips.

---

## 3) Information architecture

### Pages

1. **Home (landing + about)** `/`

   * About copy
   * Featured posts
   * Recent posts
   * Subscribe CTA
2. **Blog index** `/blog/`

   * Full reverse-chronological listing
3. **Post detail** `/blog/YYYY/MM/DD/slug/` (or standard Jekyll permalink)
4. **Tags** `/tags/`

   * Tag index + per-tag sections
5. **Subscribe** `/subscribe/`

   * Dedicated Kit embed
6. **404** `/404.html`

### UI localization behavior

* Routes stay single-source (`/`, `/blog/`, `/tags/`, `/subscribe/`) with no mirrored `/ko/` path requirement.
* UI language toggle (`EN` / `KO`) localizes shared chrome only (nav labels, buttons, metadata labels, form copy).
* Locale resolution order: query param (`?lang=`) -> saved preference -> browser language -> fallback `en`.
* Blog posts are authored per-language (`lang: en` or `lang: ko`); translated counterparts are optional and linked via front matter.
* No runtime machine translation; each language version is a separately authored Markdown file.

### Navigation (top-level)

* Home
* Blog
* Tags
* Subscribe
* RSS (icon or text)
* Language toggle (`EN` / `KO`)

**Reserved space for future** (must exist now, empty):

* A small “social links slot” in header/footer that can later show **LinkedIn** and **GitHub** icons without shifting layout.

---

## 4) Content model

### Post front matter (required)

```yaml
---
layout: post
title: "…"
date: 2026-02-14
lang: en
tags: [css, javascript]
summary: "One-sentence hook shown on lists and social previews."
featured: false
---
```

`lang` must be either `en` or `ko` and describes the post content language.
Multilingual support is optional and modeled as one post file per language variant.

### Optional fields

* `reading_time_override`: for manual control
* `canonical_url`: if cross-posting later
* `draft: true`: for local preview only (not published)
* `translation_key`: shared identifier that groups EN/KO versions of the same article

### UI i18n framework

* Framework: `i18next` (client-side), initialized in `assets/js/i18n.js`
* Locale resources: `assets/i18n/en.json` and `assets/i18n/ko.json`
* Use stable translation keys for all shared UI strings (avoid hardcoded labels in includes/layouts)
* Default fallback locale is `en` when a key is missing in `ko`
* Post translation linking is optional and handled via post front matter (`lang` + `translation_key`)

---

## 5) Visual system

## 5.1 Typography

### Title font (required)

**“Stuff of Thoughts”** uses a **typewriter-style serif**.

**Recommended stack (self-host preferred):**

* Latin primary: `Courier Prime` (WOFF2 in repo)
* Korean-capable companion: `Noto Serif KR` (WOFF2 in repo)
* Final fallbacks: `"Apple SD Gothic Neo"`, `"Malgun Gothic"`, `"Noto Serif CJK KR"`, `serif`

**Usage**

* Site title (header + homepage hero)
* Post titles (H1)
* Section headers (H2/H3) optionally in the same family at smaller sizes
* For Korean (`:lang(ko)`), switch heading/title token to `Noto Serif KR` to guarantee Hangul rendering

### Body font

Body should be calm and highly readable on a dark background:

* Primary body stack: `"Noto Sans KR"`, `"Apple SD Gothic Neo"`, `"Malgun Gothic"`, `system-ui`, `sans-serif`
* Keep body **not** fully monospaced to reduce fatigue; use mono for code only.
* Requirement: every default/fallback body font must render full Korean glyph coverage (no tofu boxes)

### Type scale (desktop)

* Site title: 40–52px
* Post title: 44–60px
* H2: 24–28px
* Body: 16–18px
* Meta: 12–13px
* Line height:

  * Titles: 1.05–1.15
  * Body: 1.65–1.85

### Drop cap

* First paragraph of posts (only when post length > ~600 words)
* Drop cap is a single letter in title font, ~3.2–3.8em height, slightly lowered baseline.

---

## 5.2 Color (Monokai-first)

### Core palette (tokens)

**Background / surfaces**

* `--bg`: `#272822` (Monokai base)
* `--surface`: `#2d2e2a` (raised sheet)
* `--surface-2`: `#31322d` (hover/alt)
* `--border`: `#49483e` (Monokai muted border)

**Text**

* `--text`: `#f8f8f2`
* `--muted`: `#a1a19a` (derived from Monokai gray family)
* `--faint`: `#75715e` (Monokai comment)

**Accent (keep UI coherent)**
Pick **one** primary accent for UI chrome:

* `--accent`: `#f92672` (Monokai pink) — recommended for links/rules/buttons
  Supporting accents allowed only inside code highlighting:
* `--cyan`: `#66d9ef`
* `--green`: `#a6e22e`
* `--orange`: `#fd971f`
* `--purple`: `#ae81ff`
* `--yellow`: `#e6db74`

### Link styling

* Default: text color stays `--text`
* Underline: thin, offset underline in `--accent`
* Hover: underline thickens + subtle background tint (`--surface-2`)

### Inline code (explicit requirement)

Inline code must scream Monokai:

* Background: `--surface-2`
* Border: `1px solid --border`
* Text: `--yellow` or `--orange` (choose one; recommend `--yellow` for readability)
* Padding: `0.1em 0.35em`
* Radius: 6px

### Code blocks

* Background: slightly darker than sheet (still Monokai)
* Syntax colors follow Monokai tokens (Rouge “monokai” or custom CSS)
* Provide a “Code example” header row with:

  * left label (muted)
  * right “Copy” button (accent outline)

---

## 5.3 Layout, grid, and depth

### Page “stage” (screenshot-derived)

* Full-viewport background: Monokai base + subtle radial vignette.
* Centered “sheet”:

  * Max width: 980–1120px container
  * Text column inside sheet: 680–760px
  * Sheet padding: 56–72px top, 48–64px sides
  * Border: 1px `--border`
  * Shadow: soft, large blur (to mimic “floating paper”)

### Rails

On wide screens (≥1100px):

* Right rail inside sheet:

  * “All posts”
  * Tag list
  * Subscribe link
* Left rail is **reserved** for future social links:

  * For now: empty space (no icons)
  * Later: GitHub + LinkedIn icons appear without shifting main column

On smaller screens:

* Rails collapse under header as a compact row: `Blog · Tags · Subscribe · RSS`

---

## 6) Components

## 6.1 Header

**Contents**

* Left: Site title “Stuff of Thoughts” (click → home)
* Right: nav items (Home/Blog/Tags/Subscribe/RSS)
* Reserved social slot (hidden until configured):

  * layout reserves ~56px; when enabled, icons appear

**Behavior**

* Sticky header optional; if used, keep it subtle (no big shadows, just a faint border line).

## 6.2 Home (landing + about)

**Top section**

* Title: “Stuff of Thoughts” large
* One-paragraph about
* “Subscribe” CTA button

**Featured posts**

* 3–5 curated links (manual list in config or `featured: true`)
* Each entry shows:

  * title
  * date
  * tags

**Recent posts**

* Simple list, 10–20 items with date + title + tags

## 6.3 Blog index

* List of posts with:

  * date (muted)
  * title (title font)
  * one-line summary
  * tags

Optional: pagination (static) after ~30 posts.

## 6.4 Post page

**Top meta row**

* Date (muted)
* Reading time (muted)
* Tags (chips)

**Title**

* Huge, typewriter-serif
* Under-title accent rule: 1–2px in `--accent`

**Body**

* Comfortable line length
* Drop cap on first paragraph for long posts
* Images centered, max width = text column, with subtle border

**Code blocks**

* Code header row: “Code example” + “Copy”
* Monokai syntax highlighting

**Footer**

* Previous / Next post links with accent underline
* Comments section
* Subscribe CTA (small)

## 6.5 Tags

**Tags index page**

* Alphabetical tag list at top
* Below: per-tag sections on the same page (anchor links)

  * Avoid generating many separate pages unless you later switch to Actions-based build.
  * This keeps it “sensible” for GitHub Pages while still feeling complete.

## 6.6 Subscribe

* Dedicated page with:

  * short pitch
  * Kit embed form
  * privacy note (“unsubscribe anytime”, “we store emails in Kit”)

**CAPTCHA**

* Rely on Kit’s built-in form protections (honeypot + conditional challenges) to satisfy the “captcha for signup” requirement. ([help.kit.com][1])
  (No custom CAPTCHA widget required on the static site.)

## 6.7 Comments (utterances)

* Embedded at bottom of post, after prev/next.
* Uses GitHub Issues for storage, no ads/tracking, and supports dark theme. ([GitHub][2])
  **Implementation constraints**
* The comments repo must be public for readers to load/comment.
* Theme set to a dark variant tuned to Monokai (or closest supported).

---

## 7) Interaction & motion

* Hover states are minimal:

  * links: underline thickens
  * tag chips: background tint
  * copy button: accent fill on hover
* Copy code:

  * on click: “Copied” micro-toast near button (no modal)
* Prefer **no page transitions**; keep it crisp and doc-like.

---

## 8) Responsiveness

### Breakpoints

* Mobile: < 640px
* Tablet: 640–1024px
* Desktop: > 1024px
* Wide: > 1280px (enable rails)

### Mobile rules

* Title size reduced (H1 ~34–40px)
* Rails collapse into a single nav row
* Code blocks horizontally scroll with momentum; show “Copy” still

---

## 9) Accessibility & legibility

* Contrast: Monokai text on dark is strong; ensure muted text still meets AA for small sizes.
* Focus styles: visible focus ring using `--cyan` or `--accent`.
* Motion: respect `prefers-reduced-motion`.
* Code blocks: ensure line-height and font-size are readable (min 14–15px).
* Set correct document language per page using post front matter (`<html lang="en">` or `<html lang="ko">` for posts).
* Korean typography: use `word-break: keep-all` for paragraphs and avoid awkward Hangul wrapping.

---

## 10) SEO & metadata

* Canonical URL: `https://stuffs.blog`
* OpenGraph/Twitter cards:

  * Use `summary_large_image` by default
* RSS feed exposed in header + nav
* `sitemap.xml` + `robots.txt`
* If language-variant landing pages are added later, emit `hreflang` alternates (`en`, `ko`) for those variants
* For posts with matching `translation_key`, emit `hreflang` alternates for the available language variants

---

## 11) Implementation notes (Jekyll + GitHub Pages)

### Core approach

* Standard Jekyll structure:

  * `_posts/` for Markdown
  * `_layouts/` for `home`, `post`, `page`
  * `_includes/` for header/footer/components
  * `assets/` for CSS/JS/fonts

### Plugins (keep it GitHub Pages-friendly)

* RSS feed plugin (for `/feed.xml`)
* SEO + sitemap if desired

### Localization implementation (GitHub Pages-safe)

* Avoid non-supported Jekyll i18n plugins; use client-side `i18next`.
* Keep one set of routes and localize UI strings at render time.
* Add a reusable language switcher include in header.
* Translate shared UI via `data-i18n` keys in templates/includes.
* Persist selected locale (`en` or `ko`) in local storage.
* Build a post translation map by `translation_key`; render alternate-language post links only when a variant exists.
* Self-host Korean font files in `assets/fonts/` and preload only the needed weights.

### Repo visibility

* Site repo may be private on GitHub Pro while Pages is published publicly. ([GitHub Docs][3])

---

## 12) Future-proofing (required: LinkedIn + GitHub later)

**Design requirement:** Adding LinkedIn/GitHub later must not require layout changes.

### How we guarantee this

* **Reserved social slot** in header and footer:

  * Invisible but space-reserved on desktop
  * When configured later, icons appear in that exact slot
* Social links configuration (future):

  * `social.github`
  * `social.linkedin`

No UI for these links ships now; only the slot and styling rules exist.

---

## 13) Acceptance criteria (what “done” means)

1. Site title displays exactly: **Stuff of Thoughts** in typewriter-style serif.
2. Home page is an About page + featured posts + recent posts.
3. Blog index lists posts with date, title, summary, tags.
4. Post pages include:

   * meta row + huge title + accent rule
   * Monokai inline code styling
   * Monokai code blocks with “Copy” button
   * prev/next links
   * comments embed (GitHub Issues)
5. Tags page exists and allows browsing posts by tag without a backend.
6. Subscribe page exists with Kit embed and spam protection handled by Kit.
7. Visual language matches the screenshots’ feel:

   * centered “sheet on stage”
   * editorial/terminal typography
   * minimal navigation and rails
   * subtle depth and clean spacing
8. Layout reserves a future slot for LinkedIn/GitHub icons without shifting content.
9. UI is localized via `i18next` with `en`/`ko` resource files and a visible `EN` / `KO` language toggle.
10. Korean text renders Hangul correctly with the specified Korean-capable font stacks.
11. Post pages emit correct `html lang` metadata based on each post’s `lang` front matter.
12. Multilingual posts are optional: when variants share a `translation_key`, each variant exposes an alternate-language link and `hreflang`; single-language posts still work without alternates.

---

If you want the next step, I can produce the **exact Jekyll layout structure** (`_layouts/home.html`, `_layouts/post.html`, `assets/main.css`, `tags.html`, `subscribe.html`) and the embed snippets (Kit + utterances) to match this design 1:1.

[1]: https://help.kit.com/en/articles/9053602-the-kit-newsletter-plan?utm_source=chatgpt.com "The Kit Newsletter Plan"
[2]: https://github.com/utterance/utterances?utm_source=chatgpt.com "utterance/utterances: :crystal_ball: A lightweight comments ..."
[3]: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages?utm_source=chatgpt.com "What is GitHub Pages?"
[4]: https://kit.com/pricing?utm_source=chatgpt.com "Flexible Pricing Plans for Every Stage of Your Creator ..."
