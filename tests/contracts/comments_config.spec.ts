import { describe, expect, it } from "vitest";

import { loadYaml, readRepoFile } from "./helpers";

type CommentsConfig = {
  comments: {
    provider: "none" | "giscus";
    giscus: {
      repo?: string;
      repo_id?: string;
      category?: string;
      category_id?: string;
      mapping?: string;
    };
  };
};

describe("comments provider configuration", () => {
  it("enforces allowed provider values", () => {
    const config = loadYaml("_config.yml") as CommentsConfig;
    expect(["none", "giscus"]).toContain(config.comments.provider);
  });

  it("requires giscus keys when provider is giscus", () => {
    const config = loadYaml("_config.yml") as CommentsConfig;
    if (config.comments.provider === "giscus") {
      expect(config.comments.giscus.repo).toBeTruthy();
      expect(config.comments.giscus.repo_id).toBeTruthy();
      expect(config.comments.giscus.category).toBeTruthy();
      expect(config.comments.giscus.category_id).toBeTruthy();
      expect(config.comments.giscus.mapping).toBeTruthy();
    }
  });

  it("keeps per-post opt-in gate and giscus mount hooks in post layout", () => {
    const postLayout = readRepoFile("_layouts/post.html");
    expect(postLayout).toContain("{% if page.comments %}");
    expect(postLayout).toContain("data-comments-provider");
    expect(postLayout).toContain("aria-label=\"Comments\"");
    expect(postLayout).toContain("data-comments-mount");
    expect(postLayout).not.toContain("data-comments-toggle");
    expect(postLayout).not.toContain("Show comments");
  });

  it("loads comments loader only when giscus is enabled on opted-in post pages", () => {
    const defaultLayout = readRepoFile("_layouts/default.html");
    expect(defaultLayout).toContain("page.layout == \"post\" and page.comments and site.comments.provider == \"giscus\"");
  });
});
