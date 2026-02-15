import { expect, test } from "@playwright/test";

test("core routes remain readable with js disabled", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  const routes = ["/", "/blog/", "/tags/", "/subscribe/", "/privacy/"];
  for (const route of routes) {
    await page.goto(new URL(route, baseURL).toString());
    await expect(page.getByRole("link", { name: "Home", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Blog", exact: true })).toBeVisible();
  }

  await context.close();
});
