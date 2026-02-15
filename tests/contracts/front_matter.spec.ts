import { describe, expect, it } from "vitest";

import { listPosts, parsePost, readRepoFile } from "./helpers";

const REQUIRED_KEYS = ["layout", "post_uid", "slug", "title", "date", "tags", "summary"] as const;
const OPTIONAL_KEYS = ["description", "cover_image", "cover_image_alt", "last_modified_at", "featured", "read_time", "comments"] as const;
const ALLOWLIST = new Set([...REQUIRED_KEYS, ...OPTIONAL_KEYS]);

const POST_UID_REGEX = /^[a-z0-9][a-z0-9-]*$/;
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*$/;
const DATE_TZ_REGEX = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\s[+-]\d{4}$/;
const LAST_MODIFIED_REGEX = DATE_TZ_REGEX;

describe("front matter contract", () => {
  const posts = listPosts();

  it("contains posts", () => {
    expect(posts.length).toBeGreaterThan(0);
  });

  it("starts each post with yaml front matter at byte 0", () => {
    for (const postPath of posts) {
      const source = readRepoFile(postPath);
      expect(source.startsWith("---\n")).toBe(true);
    }
  });

  it("enforces required keys and allowed optional keys", () => {
    const postUidSet = new Set<string>();

    for (const postPath of posts) {
      const parsed = parsePost(postPath);
      const keys = Object.keys(parsed.data);

      for (const required of REQUIRED_KEYS) {
        expect(keys, `${postPath} missing required key ${required}`).toContain(required);
      }

      for (const key of keys) {
        expect(ALLOWLIST.has(key), `${postPath} has forbidden key ${key}`).toBe(true);
      }

      expect(parsed.data.permalink, `${postPath} cannot declare permalink`).toBeUndefined();
      expect(parsed.data.redirect_from, `${postPath} cannot declare redirect_from`).toBeUndefined();

      expect(String(parsed.data.layout)).toBe("post");

      const postUid = String(parsed.data.post_uid || "");
      expect(postUid).toMatch(POST_UID_REGEX);
      expect(postUidSet.has(postUid), `${postPath} has duplicate post_uid ${postUid}`).toBe(false);
      postUidSet.add(postUid);

      const slug = String(parsed.data.slug || "");
      expect(slug).toMatch(SLUG_REGEX);

      const title = String(parsed.data.title || "");
      expect(title).not.toMatch(/<[^>]+>/);

      const date = String(parsed.data.date || "");
      expect(date).toMatch(DATE_TZ_REGEX);

      const summary = String(parsed.data.summary || "");
      expect(summary.length, `${postPath} summary should be between 120 and 180 chars`).toBeGreaterThanOrEqual(120);
      expect(summary.length, `${postPath} summary should be between 120 and 180 chars`).toBeLessThanOrEqual(180);

      const tags = parsed.data.tags;
      expect(Array.isArray(tags), `${postPath} tags must be an array`).toBe(true);
      expect((tags as string[]).length).toBeGreaterThan(0);
      const normalizedTags = (tags as string[]).map((tag) => String(tag).trim().toLowerCase());
      expect(normalizedTags).toEqual(tags);
      expect(new Set(normalizedTags).size, `${postPath} tags contain duplicates`).toBe(normalizedTags.length);

      if (parsed.data.cover_image) {
        expect(parsed.data.cover_image_alt, `${postPath} cover_image_alt is required when cover_image is provided`).toBeTruthy();
      }

      if (parsed.data.last_modified_at) {
        expect(String(parsed.data.last_modified_at)).toMatch(LAST_MODIFIED_REGEX);
      }

      if (Object.prototype.hasOwnProperty.call(parsed.data, "comments")) {
        expect(typeof parsed.data.comments, `${postPath} comments must be boolean when provided`).toBe("boolean");
      }
    }
  });
});
