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

  return `/blog/${slug}/`;
}

test.describe("visual regression", () => {
  test.skip(!process.env.ENABLE_VISUAL_REGRESSION, "ENABLE_VISUAL_REGRESSION is not set");

  const route = firstPostRoute();

  async function disableVisualNoise(page: import("@playwright/test").Page) {
    await page.addStyleTag({
      content: "*,*::before,*::after{animation:none!important;transition:none!important}"
    });
  }

  test("desktop light", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(route);
    await disableVisualNoise(page);
    await expect(page).toHaveScreenshot("post-detail-desktop-light.png");
  });

  test("desktop dark", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem("stuffs_theme", "dark");
    });
    await page.goto(route);
    await disableVisualNoise(page);
    await expect(page).toHaveScreenshot("post-detail-desktop-dark.png");
  });

  test("mobile light", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    await disableVisualNoise(page);
    await expect(page).toHaveScreenshot("post-detail-mobile-light.png");
  });

  test("mobile dark", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem("stuffs_theme", "dark");
    });
    await page.goto(route);
    await disableVisualNoise(page);
    await expect(page).toHaveScreenshot("post-detail-mobile-dark.png");
  });
});
