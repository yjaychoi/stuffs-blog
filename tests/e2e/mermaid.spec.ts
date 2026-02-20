import { expect, test } from "@playwright/test";

import { listPosts, parsePost, readRepoFile } from "../contracts/helpers";

function mermaidPostRoute(): string {
  const postPath = listPosts().find((candidate) => readRepoFile(candidate).includes("```mermaid"));
  if (!postPath) {
    throw new Error("No post with a mermaid fence found");
  }

  const slug = String(parsePost(postPath).data.slug || "");
  if (!slug) {
    throw new Error(`${postPath} is missing slug front matter`);
  }

  return `/posts/${slug}/`;
}

test("renders mermaid diagram as svg", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(mermaidPostRoute());

  const rendered = page.locator(".mermaid-diagram svg");
  expect(await rendered.count()).toBeGreaterThan(0);

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(hasOverflow).toBe(false);
});
