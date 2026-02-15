import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import fg from "fast-glob";
import { describe, expect, it } from "vitest";

import { ensureBuiltSite, listBuiltFiles, readBuilt, ROOT } from "./helpers";

function gzipBytes(filePath: string): number {
  const source = fs.readFileSync(filePath);
  return zlib.gzipSync(source, { level: 9 }).byteLength;
}

describe("asset budgets", () => {
  it("enforces css/js gzip budgets", () => {
    ensureBuiltSite();

    const cssGzip = gzipBytes(path.join(ROOT, "_site/assets/css/main.css"));
    const jsFiles = [
      "theme.js",
      "code-copy.js",
      "comments.js",
      "mermaid-init.js"
    ].map((name) => gzipBytes(path.join(ROOT, "_site/assets/js", name)));

    const jsTotal = jsFiles.reduce((sum, size) => sum + size, 0);

    expect(cssGzip / 1024).toBeLessThanOrEqual(60);
    expect(jsTotal / 1024).toBeLessThanOrEqual(60);
  });

  it("enforces mermaid optional payload budget", () => {
    ensureBuiltSite();

    const mermaidGzip = gzipBytes(path.join(ROOT, "_site/assets/js/vendor/mermaid.min.js"));
    expect(mermaidGzip / 1024).toBeLessThanOrEqual(350);
  });

  it("keeps home/blog non-font image transfer budgets", () => {
    ensureBuiltSite();

    const imageFiles = fg.sync("assets/**/*.{png,jpg,jpeg,webp,gif,avif,svg}", {
      cwd: path.join(ROOT, "_site"),
      absolute: true
    });
    const total = imageFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);

    expect(total / 1024).toBeLessThanOrEqual(150);
  });

  it("loads mermaid runtime only on demand in html payload", () => {
    ensureBuiltSite();

    const htmlFiles = listBuiltFiles("**/*.html");
    for (const file of htmlFiles) {
      const html = readBuilt(file);
      expect(html, `${file} should not eagerly include mermaid vendor runtime`).not.toContain(
        "assets/js/vendor/mermaid.min.js\"></script>"
      );
    }
  });
});
