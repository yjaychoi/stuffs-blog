import { expect, test } from "@playwright/test";

test("provider=utterances lazy loads on explicit action without duplicate mounts", async ({ page, baseURL }) => {
  const requested: string[] = [];

  await page.route("https://utteranc.es/client.js", async (route) => {
    requested.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `
        (function () {
          var iframe = document.createElement("iframe");
          iframe.className = "utterances-frame";
          iframe.src = "https://utteranc.es/frame";
          document.querySelector("[data-comments-mount]").appendChild(iframe);
        })();
      `
    });
  });

  await page.route("https://utteranc.es/frame", (route) => route.fulfill({ status: 200, body: "ok" }));

  await page.setContent(`
    <section class="comments-shell" data-comments-provider="utterances" data-comments-repo="example/repo" data-comments-issue-term="pathname">
      <button type="button" class="comments-shell__toggle" data-comments-toggle aria-expanded="false" aria-controls="comments-mount">Show comments</button>
      <div id="comments-mount" class="comments-shell__mount" data-comments-mount>
        <p class="comments-shell__fallback">Comments load only after explicit user action.</p>
      </div>
    </section>
    <script src="${baseURL}/assets/js/comments.js"></script>
  `);

  await expect(page.locator("iframe.utterances-frame")).toHaveCount(0);
  expect(requested).toHaveLength(0);

  const button = page.locator("[data-comments-toggle]");
  await button.focus();
  await page.keyboard.press("Enter");

  await expect(page.locator("iframe.utterances-frame")).toHaveCount(1);
  expect(requested.length).toBeGreaterThanOrEqual(1);

  await button.click();
  await expect(page.locator("iframe.utterances-frame")).toHaveCount(1);
});
