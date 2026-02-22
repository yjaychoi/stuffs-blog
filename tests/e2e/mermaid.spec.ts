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

test("theme switch on mermaid page keeps header visible without reload", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("stuffs_theme", "light");
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(mermaidPostRoute());
  await expect(page.locator(".mermaid-diagram svg").first()).toBeVisible();

  await page.evaluate(() => {
    window.scrollTo(0, Math.max(500, window.innerHeight));
  });
  await page.waitForTimeout(120);
  await page.evaluate(() => {
    window.scrollBy(0, -120);
  });
  await page.waitForTimeout(80);

  const header = page.locator(".site-header");
  await expect(header).not.toHaveClass(/site-header--hidden/);

  await page.evaluate(() => {
    (window as unknown as Record<string, string>).__stuffsReloadProbe = "alive";
  });

  await page.locator("#theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const reloadProbe = await page.evaluate(
    () => (window as unknown as Record<string, string>).__stuffsReloadProbe || null
  );
  expect(reloadProbe).toBe("alive");
  await expect(header).not.toHaveClass(/site-header--hidden/);
});
