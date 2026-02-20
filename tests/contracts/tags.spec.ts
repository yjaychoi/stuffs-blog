import { describe, expect, it } from "vitest";

import { listPosts, loadYaml, normalizeTag, parsePost, slugify } from "./helpers";

type TagSlugMap = Record<string, string>;

describe("tag contract", () => {
  it("enforces deduped tag arrays", () => {
    for (const postPath of listPosts()) {
      const parsed = parsePost(postPath);
      const tags = parsed.data.tags as string[];
      expect(Array.isArray(tags), `${postPath} tags must be array`).toBe(true);

      const normalized = tags.map((tag) => normalizeTag(String(tag)));
      expect(normalized.every((tag) => tag.length > 0), `${postPath} tags must not be empty`).toBe(true);
      expect(new Set(normalized).size, `${postPath} tags must be deduplicated`).toBe(normalized.length);
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
        expect(slug.trim().length, `${postPath} tag slug cannot be empty for tag ${tag}`).toBeGreaterThan(0);
        expect(/\s/u.test(slug), `${postPath} tag slug cannot contain whitespace: ${slug}`).toBe(false);

        const owner = claimed.get(slug);
        expect(owner && owner !== tag, `tag slug collision on ${slug}: ${owner} vs ${tag}`).toBeFalsy();
        claimed.set(slug, tag);
      }
    }
  });
});
