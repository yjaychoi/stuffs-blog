import { describe, expect, it } from "vitest";

import { listPosts, loadYaml, normalizeTag, parsePost, slugify } from "./helpers";

type TagSlugMap = Record<string, string>;

describe("tag contract", () => {
  it("enforces lowercase and deduped tag arrays", () => {
    for (const postPath of listPosts()) {
      const parsed = parsePost(postPath);
      const tags = parsed.data.tags as string[];
      expect(Array.isArray(tags), `${postPath} tags must be array`).toBe(true);

      const normalized = tags.map((tag) => tag.toLowerCase().trim());
      expect(tags, `${postPath} tags must be lowercase`).toEqual(normalized);
      expect(new Set(tags).size, `${postPath} tags must be deduplicated`).toBe(tags.length);
    }
  });

  it("validates tag slug overrides and collision policy", () => {
    const overrides = (loadYaml("_data/tag_slugs.yml") as TagSlugMap) || {};
    const claimed = new Map<string, string>();

    for (const postPath of listPosts()) {
      const parsed = parsePost(postPath);
      const tags = parsed.data.tags as string[];
      for (const tag of tags) {
        const normalized = normalizeTag(tag);
        const slug = overrides[tag] || overrides[normalized] || slugify(tag);
        expect(slug).toMatch(/^[a-z0-9][a-z0-9-]*$/);

        const owner = claimed.get(slug);
        expect(owner && owner !== tag, `tag slug collision on ${slug}: ${owner} vs ${tag}`).toBeFalsy();
        claimed.set(slug, tag);
      }
    }
  });
});
