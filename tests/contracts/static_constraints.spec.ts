import fg from "fast-glob";
import { describe, expect, it } from "vitest";

import { ROOT, readRepoFile } from "./helpers";

const SOURCE_GLOBS = [
  "_layouts/**/*.{html,md}",
  "_includes/**/*.{html,md}",
  "assets/js/**/*.js",
  "_plugins/**/*.rb"
];

describe("static hosting constraints", () => {
  it("does not introduce internal api/network runtime dependencies", () => {
    const files = fg.sync(SOURCE_GLOBS, { cwd: ROOT, absolute: false });

    for (const file of files) {
      const source = readRepoFile(file);
      expect(source, `${file} should not call internal /api endpoints`).not.toMatch(/\/api\//);
      expect(source, `${file} should not include server runtime imports`).not.toMatch(/\bexpress\b|\bkoa\b|\bfastify\b/);
    }
  });

  it("keeps final artifact static-only by ensuring no server middleware files", () => {
    const forbiddenFiles = fg.sync(["server/**", "api/**", "functions/**"], { cwd: ROOT, absolute: false });
    expect(forbiddenFiles).toHaveLength(0);
  });
});
