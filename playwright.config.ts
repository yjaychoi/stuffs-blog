import { defineConfig } from "@playwright/test";

const port = Number.parseInt(process.env.PLAYWRIGHT_PORT || "4173", 10);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.008
    }
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    colorScheme: "light"
  },
  webServer: {
    command: `PATH="$HOME/.rbenv/shims:$PATH" npm run build && ./node_modules/.bin/http-server _site -p ${port} -s`,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI
  }
});
