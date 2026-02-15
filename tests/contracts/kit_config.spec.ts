import { describe, expect, it } from "vitest";

import { loadYaml, readRepoFile } from "./helpers";

type ConfigShape = {
  kit: {
    form: {
      form_action: string;
      form_uid: string;
      success_url: string;
      error_url?: string;
    };
  };
};

describe("kit integration contract", () => {
  it("contains required kit config values", () => {
    const config = loadYaml("_config.yml") as ConfigShape;

    expect(config.kit.form.form_action).toMatch(/^https:\/\/app\.kit\.com\/forms\/[0-9]+\/subscriptions$/);
    expect(config.kit.form.form_uid).toMatch(/^[0-9]+$/);
    expect(config.kit.form.success_url).toMatch(/^https:\/\/stuffs\.blog\/.+/);

    if (config.kit.form.error_url) {
      expect(config.kit.form.error_url).toMatch(/^https:\/\/stuffs\.blog\/.+/);
    }
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
});
