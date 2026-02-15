import { expect, test } from "@playwright/test";

test("provider=none keeps placeholder and avoids utterances traffic", async ({ page }) => {
  const utterancesRequests: string[] = [];
  page.on("request", (request) => {
    if (/utteranc\.es|github\.com|api\.github\.com/.test(request.url())) {
      utterancesRequests.push(request.url());
    }
  });

  await page.goto("/blog/2026/02/08/mysql-vector-search/");

  await expect(page.getByRole("heading", { name: "Comments" })).toBeVisible();
  await expect(page.locator(".comments-shell__placeholder")).toBeVisible();
  await expect(page.locator("iframe.utterances-frame")).toHaveCount(0);

  await page.waitForTimeout(500);
  expect(utterancesRequests).toHaveLength(0);
});
