import fs from "node:fs";
import path from "node:path";

import fg from "fast-glob";
import { describe, expect, it } from "vitest";

import { ROOT, readRepoFile } from "./helpers";

describe("font budget contract", () => {
  it("uses swap-display font loading", () => {
    const layout = readRepoFile("_layouts/default.html");
    expect(layout).toContain("display=swap");
  });

  it("keeps first-view font transfer within 350KB when self-hosting", () => {
    const files = fg.sync("assets/fonts/**/*.woff2", { cwd: ROOT, absolute: true });
    const totalBytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
    const totalKb = totalBytes / 1024;

    expect(totalKb).toBeLessThanOrEqual(350);
  });
});
