import { expect, test } from "@playwright/test";

function commentsShellFixture(
  baseURL: string,
  themeLight = "light",
  themeDark = "dark_dimmed",
  initialTheme?: "light" | "dark"
): string {
  const initialThemeScript = initialTheme
    ? `<script>document.documentElement.setAttribute("data-theme", "${initialTheme}");</script>`
    : "";
  return `
    ${initialThemeScript}
    <div style="height: 2000px;" aria-hidden="true"></div>
    <section
      class="comments-shell"
      data-comments-provider="giscus"
      data-comments-repo="yjaychoi/stuffs-blog"
      data-comments-repo-id="R_kgDORQKTuQ"
      data-comments-category="Announcements"
      data-comments-category-id="DIC_kwDORQKTuc4C2fre"
      data-comments-mapping="url"
      data-comments-strict="0"
      data-comments-reactions-enabled="1"
      data-comments-emit-metadata="0"
      data-comments-input-position="bottom"
      data-comments-theme-light="${themeLight}"
      data-comments-theme-dark="${themeDark}"
      data-comments-lang="ko"
      data-comments-loading="lazy"
    >
      <div id="comments-mount" class="comments-shell__mount" data-comments-mount>
        <p class="comments-shell__fallback" data-comments-loading>Comments will load when this section enters view.</p>
      </div>
    </section>
    <script src="${baseURL}/assets/js/comments.js"></script>
  `;
}

test("provider=giscus falls back to built-in theme keys for localhost custom theme URLs", async ({ page, baseURL }) => {
  await page.route("https://giscus.app/client.js", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "window.__giscus_theme_probe = true;"
    });
  });

  await page.setContent(commentsShellFixture(baseURL, "/assets/css/giscus-light.css", "/assets/css/giscus-dark.css"));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  const script = page.locator("script[data-comments-client='giscus']");
  await expect(script).toHaveCount(1);
  await expect(script).toHaveAttribute("data-theme", "light");

  await page.setContent(commentsShellFixture(baseURL, "/assets/css/giscus-light.css", "/assets/css/giscus-dark.css", "dark"));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  const darkScript = page.locator("script[data-comments-client='giscus']");
  await expect(darkScript).toHaveCount(1);
  await expect(darkScript).toHaveAttribute("data-theme", "dark_dimmed");
});

test("provider=giscus auto-loads only after scrolling to comments and avoids duplicates", async ({ page, baseURL }) => {
  const requested: string[] = [];

  await page.route("https://giscus.app/client.js", async (route) => {
    requested.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `
        (function () {
          var iframe = document.createElement("iframe");
          iframe.className = "giscus-frame";
          iframe.src = "https://giscus.app/frame";
          document.querySelector("[data-comments-mount]").appendChild(iframe);
        })();
      `
    });
  });

  await page.route("https://giscus.app/frame", (route) => route.fulfill({ status: 200, body: "ok" }));

  await page.setContent(commentsShellFixture(baseURL));

  await page.waitForTimeout(300);
  await expect(page.locator("iframe.giscus-frame")).toHaveCount(0);
  expect(requested).toHaveLength(0);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  await expect(page.locator("iframe.giscus-frame")).toHaveCount(1);
  expect(requested).toHaveLength(1);

  await page.evaluate(() => {
    window.scrollTo(0, 0);
    window.scrollTo(0, document.body.scrollHeight);
  });
  await expect(page.locator("iframe.giscus-frame")).toHaveCount(1);
  expect(requested).toHaveLength(1);
});

test("provider=giscus keeps readable fallback when giscus load fails", async ({ page, baseURL }) => {
  const requested: string[] = [];

  await page.route("https://giscus.app/client.js", async (route) => {
    requested.push(route.request().url());
    await route.abort("failed");
  });

  await page.setContent(commentsShellFixture(baseURL));

  await page.waitForTimeout(300);
  expect(requested).toHaveLength(0);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  await expect(page.locator(".comments-shell__fallback")).toContainText(
    "Unable to load comments right now. Please try again later."
  );
  await expect(page.locator("iframe.giscus-frame")).toHaveCount(0);
  expect(requested).toHaveLength(1);
});

test("provider=giscus shows fallback when script loads but no comments frame mounts", async ({ page, baseURL }) => {
  const requested: string[] = [];

  await page.route("https://giscus.app/client.js", async (route) => {
    requested.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "window.__giscus_loaded_without_frame = true;"
    });
  });

  await page.setContent(commentsShellFixture(baseURL));
  await page.waitForTimeout(300);
  expect(requested).toHaveLength(0);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  await expect(page.locator(".comments-shell__fallback")).toContainText(
    "Unable to initialize giscus comments. Check the repository/discussions configuration."
  );
  await expect(page.locator("iframe.giscus-frame")).toHaveCount(0);
  expect(requested).toHaveLength(1);
});
