import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { listPosts, parsePost } from "../contracts/helpers";

function firstPostRoute(): string {
  const postPath = listPosts()[0];
  if (!postPath) {
    throw new Error("No posts found in _posts");
  }

  const slug = String(parsePost(postPath).data.slug || "");
  if (!slug) {
    throw new Error(`${postPath} is missing slug front matter`);
  }

  return `/posts/${slug}/`;
}

const routes = ["/", "/posts/", "/tags/", firstPostRoute(), "/subscribe/", "/privacy/"];

test("accessibility smoke on key routes", async ({ page }) => {
  for (const theme of ["light", "dark"] as const) {
    for (const route of routes) {
      await page.addInitScript((selectedTheme) => {
        localStorage.setItem("stuffs_theme", selectedTheme);
      }, theme);

      await page.goto(route);

      const results = await new AxeBuilder({ page }).exclude(".code-panel").analyze();
      expect(results.violations, `${route} (${theme}) has accessibility violations`).toEqual([]);
    }
  }
});
