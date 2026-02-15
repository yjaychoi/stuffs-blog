import { describe, expect, it } from "vitest";

import { ensureBuiltSite, readBuilt } from "./helpers";

describe("rss feed", () => {
  it("renders valid xml payload with items", () => {
    ensureBuiltSite();
    const feed = readBuilt("feed.xml");

    expect(feed.startsWith("<?xml")).toBe(true);
    expect(feed).toMatch(/<feed[^>]*xmlns="http:\/\/www\.w3\.org\/2005\/Atom"/);
    expect(feed).toMatch(/<entry>/);
    expect(feed).toMatch(/https:\/\/stuffs\.blog\/blog\//);
  });
});
