import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/", "/blog/", "/tags/", "/blog/mysql-vector-search/", "/subscribe/", "/privacy/"];

test("accessibility smoke on key routes", async ({ page }) => {
  for (const theme of ["light", "dark"] as const) {
    for (const route of routes) {
      await page.addInitScript((selectedTheme) => {
        localStorage.setItem("stuffs_theme", selectedTheme);
      }, theme);

      await page.goto(route);

      const results = await new AxeBuilder({ page }).exclude(".code-panel").analyze();
      expect(results.violations, `${route} (${theme}) has accessibility violations`).toEqual([]);
    }
  }
});
