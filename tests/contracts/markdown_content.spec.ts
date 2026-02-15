import { describe, expect, it } from "vitest";

import { listPosts, parsePost } from "./helpers";

type Heading = {
  level: number;
  text: string;
  hasExplicitId: boolean;
};

function collectHeadings(markdown: string): Heading[] {
  const lines = markdown.split(/\r?\n/);
  const headings: Heading[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{2,6})\s+(.+?)\s*$/);
    if (!match) {
      continue;
    }

    const level = match[1].length;
    const rawText = match[2].trim();
    const hasExplicitId = /\{#[-a-z0-9_]+\}\s*$/i.test(rawText);
    const text = rawText.replace(/\s*\{#[-a-z0-9_]+\}\s*$/i, "").trim().toLowerCase();

    headings.push({ level, text, hasExplicitId });
  }

  return headings;
}

describe("markdown heading/body contract", () => {
  const posts = listPosts();

  it("forbids body-level h1 and enforces heading tier increments", () => {
    for (const postPath of posts) {
      const parsed = parsePost(postPath);
      const body = parsed.content;

      expect(body).not.toMatch(/^#\s+/m);

      const headings = collectHeadings(body);
      for (let i = 1; i < headings.length; i += 1) {
        const previous = headings[i - 1];
        const current = headings[i];
        expect(current.level - previous.level, `${postPath} has skipped heading levels`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("requires explicit ids for duplicate heading text", () => {
    for (const postPath of posts) {
      const parsed = parsePost(postPath);
      const headings = collectHeadings(parsed.content);
      const seen = new Set<string>();

      for (const heading of headings) {
        const key = heading.text;
        if (!key) {
          continue;
        }

        if (seen.has(key)) {
          expect(
            heading.hasExplicitId,
            `${postPath} has duplicate heading "${heading.text}" without explicit id`
          ).toBe(true);
        }

        seen.add(key);
      }
    }
  });
});
