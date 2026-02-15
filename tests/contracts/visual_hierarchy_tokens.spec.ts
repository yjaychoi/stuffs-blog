import { describe, expect, it } from "vitest";

import { readRepoFile } from "./helpers";

describe("visual hierarchy token contract", () => {
  const css = readRepoFile("assets/css/main.css");

  it("preserves metadata/title/body hierarchy selectors", () => {
    expect(css).toContain(".meta-row");
    expect(css).toContain(".post-title");
    expect(css).toContain(".post-content");
    expect(css).toContain(".post-content h2");
    expect(css).toContain(".post-content h3");
  });

  it("keeps title dominance and accent rule lock values", () => {
    expect(css).toMatch(/\.post-title\s*\{[\s\S]*font-size:\s*clamp\(1\.65rem,[\s\S]*2\.05rem\)/);
    expect(css).toMatch(/\.post-title-rule\s*\{[\s\S]*width:\s*96px;[\s\S]*height:\s*4px;/);
  });

  it("keeps major section spacing cadence", () => {
    expect(css).toMatch(/\.post-divider\s*\{[\s\S]*margin:\s*2\.7rem\s0;/);
    expect(css).toMatch(/\.post-subscribe\s*\{[\s\S]*margin-top:\s*2\.6rem;/);
    expect(css).toMatch(/\.comments-shell\s*\{[\s\S]*margin-top:\s*3\.6rem;/);
  });
});
