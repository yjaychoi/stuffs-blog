# Local Development

## Prerequisites

- Ruby version from `.ruby-version`
- Node.js version from `.nvmrc`
- Bundler and npm available on `PATH`

## Install

```bash
bundle config set frozen true
bundle install
npm ci
```

## Build

```bash
npm run build:meta
bundle exec jekyll build
```

## Run locally

```bash
bundle exec jekyll serve --livereload
```

Site will be served at `http://127.0.0.1:4000`.

## Test

```bash
npx vitest run tests/contracts
npx size-limit
npx playwright install --with-deps chromium
npx playwright test
```

## Visual baseline updates

```bash
ENABLE_VISUAL_REGRESSION=1 npx playwright test tests/e2e/visual_regression.spec.ts --update-snapshots
```
