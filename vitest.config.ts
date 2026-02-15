import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/contracts/**/*.spec.ts"],
    environment: "node",
    globals: true,
    testTimeout: 60_000,
    hookTimeout: 60_000
  }
});
