import { describe, expect, it } from "vitest";

import { listPosts, loadYaml, readRepoFile } from "./helpers";

describe("image embed contract", () => {
  it("keeps markdown-image include with required attributes", () => {
    const includeSource = readRepoFile("_includes/markdown-image.html");

    expect(includeSource).toContain("include.src");
    expect(includeSource).toContain("include.alt");
    expect(includeSource).toContain("include.width");
    expect(includeSource).toContain("include.height");
    expect(includeSource).toContain("<figure");
  });

  it("uses declared external host allowlist structure", () => {
    const hosts = loadYaml("_data/external_asset_hosts.yml") as string[];
    expect(Array.isArray(hosts)).toBe(true);
    expect(hosts.length).toBeGreaterThan(0);
  });

  it("requires alt text for markdown images in posts", () => {
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;

    for (const postPath of listPosts()) {
      const source = readRepoFile(postPath);
      const matches = source.matchAll(imageRegex);

      for (const match of matches) {
        const alt = (match[1] || "").trim();
        const url = (match[2] || "").trim();
        if (!url) {
          continue;
        }

        expect(alt.length, `${postPath} image ${url} must include alt text`).toBeGreaterThan(0);
      }
    }
  });
});
