import { describe, expect, it } from "vitest";

import { readRepoFile } from "./helpers";

function parseHex(value: string): [number, number, number] {
  const hex = value.replace("#", "");
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16)
  ];
}

function srgbToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function contrastRatio(foreground: string, background: string): number {
  const [r1, g1, b1] = parseHex(foreground).map(srgbToLinear) as [number, number, number];
  const [r2, g2, b2] = parseHex(background).map(srgbToLinear) as [number, number, number];

  const l1 = 0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1;
  const l2 = 0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2;

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function extractVarMap(css: string, selector: string): Record<string, string> {
  const regex = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\}`);
  const block = css.match(regex)?.[1] || "";
  const entries = [...block.matchAll(/--([a-z0-9-]+):\s*(#[a-f0-9]{6})/gi)];

  return Object.fromEntries(entries.map((entry) => [entry[1], entry[2].toLowerCase()]));
}

describe("theme contrast policy", () => {
  const css = readRepoFile("assets/css/main.css");
  const light = extractVarMap(css, ":root");
  const dark = extractVarMap(css, 'html\\[data-theme="dark"\\]');

  it("meets wcag aa for text tokens", () => {
    expect(contrastRatio(light.text, light.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light["muted-text"], light.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.text, dark.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark["muted-text"], dark.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("meets code surface and token policy", () => {
    expect(contrastRatio(light["code-fg"], light["code-bg"])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark["code-fg"], dark["code-bg"])).toBeGreaterThanOrEqual(4.5);

    const lightTokens = ["code-keyword", "code-string", "code-number", "code-function", "code-type", "code-meta"];
    for (const token of lightTokens) {
      expect(contrastRatio(light[token], light["code-bg"]), `light ${token} contrast`).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(dark[token], dark["code-bg"]), `dark ${token} contrast`).toBeGreaterThanOrEqual(3);
    }
  });
});
