import { expect, test } from "@playwright/test";

test("core routes remain readable with js disabled", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  const routes = ["/", "/posts/", "/tags/", "/subscribe/", "/privacy/"];
  for (const route of routes) {
    await page.goto(new URL(route, baseURL).toString());
    const primaryNav = page.locator("#site-nav");
    await expect(primaryNav.locator('a[href="/"]')).toBeVisible();
    await expect(primaryNav.locator('a[href="/posts/"]')).toBeVisible();
  }

  await context.close();
});
