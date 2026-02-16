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

## Generated config overrides (Kit and Cloudflare analytics)

For production-like local builds, generate config overrides from environment variables.

```bash
export KIT_FORM_ID=<numeric-form-id>
export KIT_FORM_UID=<lowercase-form-uid>
export CLOUDFLARE_WEB_ANALYTICS_TOKEN=<cloudflare-token>

node scripts/generate-kit-config.mjs
node scripts/generate-cloudflare-config.mjs
```

Build with generated overrides:

```bash
npm run build:meta
bundle exec jekyll build --config _config.yml,_config.kit.generated.yml,_config.cloudflare.generated.yml
```

Notes:

- `scripts/generate-kit-config.mjs` fails fast when `KIT_FORM_ID`/`KIT_FORM_UID` are missing or invalid.
- `scripts/generate-cloudflare-config.mjs` always generates `_config.cloudflare.generated.yml`; if `CLOUDFLARE_WEB_ANALYTICS_TOKEN` is unset, analytics remains disabled.

## Run locally

```bash
bundle exec jekyll serve --livereload
```

To run with generated overrides:

```bash
bundle exec jekyll serve --livereload --config _config.yml,_config.kit.generated.yml,_config.cloudflare.generated.yml
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
