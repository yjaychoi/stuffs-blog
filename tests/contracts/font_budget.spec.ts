import fs from "node:fs";

import fg from "fast-glob";
import { describe, expect, it } from "vitest";

import { ROOT, readRepoFile } from "./helpers";

describe("font budget contract", () => {
  it("does not depend on external webfont CDNs", () => {
    const layout = readRepoFile("_layouts/default.html");
    expect(layout).not.toContain("fonts.googleapis.com");
    expect(layout).not.toContain("fonts.gstatic.com");
  });

  it("keeps first-view font transfer within 350KB when self-hosting", () => {
    const files = fg.sync("assets/fonts/**/*.woff2", { cwd: ROOT, absolute: true });
    const totalBytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
    const totalKb = totalBytes / 1024;

    expect(totalKb).toBeLessThanOrEqual(350);
  });
});
