import { describe, expect, it } from "vitest";

import { listPosts, loadYaml, parsePost } from "./helpers";

type ConfigShape = {
  permalink?: string;
};

describe("permalink contract", () => {
  it("uses canonical post permalink strategy", () => {
    const config = loadYaml("_config.yml") as ConfigShape;
    expect(config.permalink).toBe("/blog/:slug/");
  });

  it("forbids manual permalink overrides in posts", () => {
    for (const postPath of listPosts()) {
      const parsed = parsePost(postPath);
      expect(parsed.data.permalink, `${postPath} may not define permalink`).toBeUndefined();
    }
  });

  it("requires filename date prefix and slug suffix", () => {
    for (const postPath of listPosts()) {
      const parsed = parsePost(postPath);
      const filename = postPath.split("/").pop() as string;
      const match = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
      expect(match, `${postPath} must match YYYY-MM-DD-slug.md`).not.toBeNull();
      expect(match?.[2], `${postPath} slug must align with filename`).toBe(String(parsed.data.slug));
    }
  });
});
