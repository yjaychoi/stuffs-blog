import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

const deployBaseURL = process.env.PLAYWRIGHT_BASE_URL;

if (!deployBaseURL) {
  throw new Error("PLAYWRIGHT_BASE_URL is required for deploy smoke checks");
}

export default defineConfig({
  ...baseConfig,
  use: {
    ...(baseConfig.use || {}),
    baseURL: deployBaseURL
  },
  webServer: undefined
});
