import { describe, expect, it } from "vitest";

import { loadYaml } from "./helpers";

type RedirectEntry = {
  from: string;
  to: string;
};

describe("redirect mappings", () => {
  it("validates syntax and duplicate-free mapping", () => {
    const redirects = (loadYaml("_data/redirects.yml") as RedirectEntry[]) || [];
    expect(Array.isArray(redirects)).toBe(true);

    const seen = new Set<string>();

    for (const entry of redirects) {
      expect(entry.from).toMatch(/^\/.+/);
      expect(entry.to).toMatch(/^(\/|https:\/\/)/);
      expect(seen.has(entry.from), `duplicate redirect from ${entry.from}`).toBe(false);
      seen.add(entry.from);
    }
  });
});
