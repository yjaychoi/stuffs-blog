import { describe, expect, it } from "vitest";

import { loadYaml, readRepoFile } from "./helpers";

type CommentsConfig = {
  comments: {
    provider: "none" | "utterances";
    utterances: {
      repo?: string;
      issue_term?: string;
    };
  };
};

describe("comments provider configuration", () => {
  it("enforces allowed provider values and default none", () => {
    const config = loadYaml("_config.yml") as CommentsConfig;
    expect(["none", "utterances"]).toContain(config.comments.provider);
    expect(config.comments.provider).toBe("none");
  });

  it("requires utterances keys when provider is utterances", () => {
    const config = loadYaml("_config.yml") as CommentsConfig;
    if (config.comments.provider === "utterances") {
      expect(config.comments.utterances.repo).toBeTruthy();
      expect(config.comments.utterances.issue_term).toBeTruthy();
    }
  });

  it("keeps both placeholder and utterances activation hooks in post layout", () => {
    const postLayout = readRepoFile("_layouts/post.html");
    expect(postLayout).toContain("data-comments-provider");
    expect(postLayout).toContain("Comments are planned with utterances");
    expect(postLayout).toContain("data-comments-toggle");
    expect(postLayout).toContain("Show comments");
  });
});
