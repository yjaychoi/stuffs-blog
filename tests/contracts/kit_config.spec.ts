import { describe, expect, it } from "vitest";

import { loadYaml, readRepoFile } from "./helpers";

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
  it("contains required kit config values", () => {
    const config = loadYaml("_config.yml") as ConfigShape;

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
