import { describe, expect, it } from "vitest";

import { loadYaml, readRepoFile } from "./helpers";

type CloudflareAnalyticsConfig = {
  cloudflare?: {
    analytics?: {
      token?: string;
    };
  };
};

describe("cloudflare analytics configuration", () => {
  it("keeps cloudflare analytics token default empty in base config", () => {
    const config = loadYaml("_config.yml") as CloudflareAnalyticsConfig;
    expect(config.cloudflare?.analytics?.token ?? "").toBe("");
  });

  it("gates analytics script include by token presence", () => {
    const includeSource = readRepoFile("_includes/cloudflare-analytics.html");

    expect(includeSource).toContain("cloudflare_token");
    expect(includeSource).toContain("cloudflare_token != \"\"");
    expect(includeSource).toContain("https://static.cloudflareinsights.com/beacon.min.js");
    expect(includeSource).toContain("data-cf-beacon");
  });

  it("includes analytics partial in default layout and allowlists required CSP hosts", () => {
    const defaultLayout = readRepoFile("_layouts/default.html");

    expect(defaultLayout).toContain("{% include cloudflare-analytics.html %}");
    expect(defaultLayout).toContain("https://static.cloudflareinsights.com");
    expect(defaultLayout).toContain("https://cloudflareinsights.com");
  });
});
