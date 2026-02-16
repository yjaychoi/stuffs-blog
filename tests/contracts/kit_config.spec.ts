import { describe, expect, it } from "vitest";

import { existsInRepo, loadYaml, readRepoFile } from "./helpers";

type ConfigShape = {
  kit: {
    form: {
      form_id: string;
      form_action: string;
      form_uid: string;
      success_url: string;
    };
  };
};

describe("kit integration contract", () => {
  it("keeps placeholder kit values in base config", () => {
    const baseConfig = loadYaml("_config.yml") as ConfigShape;

    expect(baseConfig.kit.form.form_id).toBe("KIT_FORM_ID");
    expect(baseConfig.kit.form.form_uid).toBe("KIT_FORM_UID");
    expect(baseConfig.kit.form.form_action).toBe("https://app.kit.com/forms/KIT_FORM_ID/subscriptions");
  });

  it("contains required concrete kit config values in CI/deploy builds", () => {
    const hasGeneratedOverride = existsInRepo("_config.kit.generated.yml");

    if (process.env.GITHUB_ACTIONS === "true") {
      expect(hasGeneratedOverride).toBe(true);
    }

    if (!hasGeneratedOverride) {
      return;
    }

    const config = loadYaml("_config.kit.generated.yml") as ConfigShape;

    expect(config.kit.form.form_id).toMatch(/^[0-9]+$/);
    expect(config.kit.form.form_id).not.toBe("0000000");
    expect(config.kit.form.form_uid).toMatch(/^[a-z0-9]+$/);
    expect(config.kit.form.form_uid).not.toBe("0000000");
    expect(config.kit.form.form_action).toBe(`https://app.kit.com/forms/${config.kit.form.form_id}/subscriptions`);
    expect(config.kit.form.success_url).toBe("https://stuffs.blog/subscribe/success/");
    expect((config.kit.form as Record<string, unknown>).error_url).toBeUndefined();
  });

  it("includes subscribe form on subscribe route and post layout", () => {
    const subscribeLayout = readRepoFile("_layouts/subscribe.html");
    const postLayout = readRepoFile("_layouts/post.html");

    expect(subscribeLayout).toContain("include subscribe-form.html");
    expect(postLayout).toContain("include subscribe-form.html");
  });

  it("blocks external kit embed scripts", () => {
    const defaultLayout = readRepoFile("_layouts/default.html");
    const subscribeInclude = readRepoFile("_includes/subscribe-form.html");

    expect(defaultLayout).not.toMatch(/kit\.com\/embed|forms\.convertkit\.com/);
    expect(subscribeInclude).not.toMatch(/<script/i);
  });

  it("keeps redirects configured on Kit instead of client-side hidden fields", () => {
    const subscribeInclude = readRepoFile("_includes/subscribe-form.html");

    expect(subscribeInclude).toContain("data-sv-form");
    expect(subscribeInclude).toContain("data-uid");
    expect(subscribeInclude).not.toContain('name="redirect_to"');
    expect(subscribeInclude).not.toContain('name="error_redirect_to"');
  });
});
