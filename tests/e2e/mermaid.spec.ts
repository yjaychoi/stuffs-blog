import { expect, test } from "@playwright/test";

test("renders mermaid diagram as svg", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/blog/mysql-vector-search/");

  const rendered = page.locator(".mermaid-diagram svg");
  await expect(rendered).toHaveCount(1);

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(hasOverflow).toBe(false);
});
