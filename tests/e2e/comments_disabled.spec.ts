import { expect, test } from "@playwright/test";

test("provider=none keeps placeholder and avoids third-party comments traffic", async ({ page, baseURL }) => {
  const giscusRequests: string[] = [];
  page.on("request", (request) => {
    if (/giscus\.app|github\.com|api\.github\.com/.test(request.url())) {
      giscusRequests.push(request.url());
    }
  });

  await page.setContent(`
    <section class="comments-shell" data-comments-provider="none">
      <div class="comments-shell__placeholder" aria-hidden="true" style="min-height: 120px;"></div>
    </section>
    <script src="${baseURL}/assets/js/comments.js"></script>
  `);

  await expect(page.locator(".comments-shell__placeholder")).toBeVisible();
  await expect(page.locator("iframe.giscus-frame")).toHaveCount(0);

  await page.waitForTimeout(500);
  expect(giscusRequests).toHaveLength(0);
});
