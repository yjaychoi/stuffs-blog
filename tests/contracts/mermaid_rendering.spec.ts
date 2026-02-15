import { describe, expect, it } from "vitest";

import { ensureBuiltSite, listPosts, readBuilt, readRepoFile } from "./helpers";

describe("mermaid contract", () => {
  it("ships a self-hosted runtime and init script", () => {
    expect(readRepoFile("assets/js/vendor/mermaid.min.js").length).toBeGreaterThan(0);

    const initScript = readRepoFile("assets/js/mermaid-init.js");
    expect(initScript).toContain("hasMermaidBlocks");
    expect(initScript).toContain("pre.dataset.processed");
    expect(initScript).toContain("/assets/js/vendor/mermaid.min.js");
  });

  it("contains at least one mermaid fence in source content", () => {
    const hasMermaidPost = listPosts().some((postPath) => readRepoFile(postPath).includes("```mermaid"));
    expect(hasMermaidPost).toBe(true);
  });

  it("keeps readable fallback in built output", () => {
    ensureBuiltSite();
    const html = readBuilt("blog/2026/02/08/mysql-vector-search/index.html");
    expect(html).toMatch(/language-mermaid|mermaid/);
  });
});
