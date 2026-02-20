import { expect, test } from "@playwright/test";

test("@smoke desktop shell interactions", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/");

  const primaryNav = page.locator("#site-nav");
  await expect(primaryNav.locator('a[href="/"]')).toBeVisible();
  await expect(primaryNav.locator('a[href="/posts/"]')).toBeVisible();
  await expect(primaryNav.locator('a[href="/feed.xml"]')).toBeVisible();
  await expect(page.locator('.site-header__actions > a[href="/subscribe/"]')).toBeVisible();

  const toggle = page.getByRole("button", { name: /switch to dark mode/i });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(hasOverflow).toBe(false);
});

test("@smoke mobile menu and theme", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/posts/");

  const menuButton = page.getByRole("button", { name: /open navigation menu/i });
  await expect(menuButton).toBeVisible();
  await menuButton.click();

  const primaryNav = page.locator("#site-nav");
  await expect(primaryNav.locator('a[href="/"]')).toBeVisible();
  await expect(primaryNav.locator('a[href="/posts/"]')).toBeVisible();

  const toggle = page.locator("#theme-toggle");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(hasOverflow).toBe(false);
});
