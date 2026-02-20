import fs from "node:fs";
import path from "node:path";

import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { ensureBuiltSite, existsInRepo, listPosts, loadYaml, parsePost, readBuilt, ROOT } from "./helpers";

describe("seo and metadata contracts", () => {
  const requiredRoutes = [
    "index.html",
    "posts/index.html",
    "tags/index.html",
    "subscribe/index.html",
    "subscribe/success/index.html",
    "privacy/index.html",
    "404.html",
    "feed.xml"
  ];

  it("renders required routes", () => {
    ensureBuiltSite();

    for (const route of requiredRoutes) {
      expect(existsInRepo(path.posix.join("_site", route)), `${route} is missing in _site`).toBe(true);
    }
  });

  it("sets canonical base configuration and CNAME", () => {
    const config = loadYaml("_config.yml") as { url: string; baseurl: string };
    expect(config.url).toBe("https://stuffs.blog");
    expect(config.baseurl).toBe("");
    expect(fs.readFileSync(path.join(ROOT, "CNAME"), "utf8").trim()).toBe("stuffs.blog");
  });

  it("emits canonical links on key pages", () => {
    ensureBuiltSite();

    const home = load(readBuilt("index.html"));
    const posts = load(readBuilt("posts/index.html"));

    expect(home("link[rel='canonical']").attr("href")).toBe("https://stuffs.blog/");
    expect(posts("link[rel='canonical']").attr("href")).toBe("https://stuffs.blog/posts/");
  });

  it("normalizes posts page 1 route with noindex and canonical", () => {
    ensureBuiltSite();

    const pageOne = load(readBuilt("posts/page/1/index.html"));
    expect(pageOne("meta[name='robots']").attr("content") || "").toContain("noindex");
    expect(pageOne("link[rel='canonical']").attr("href")).toBe("/posts/");
  });

  it("includes deterministic metadata mapping on post pages", () => {
    ensureBuiltSite();

    const firstPostPath = listPosts()[0];
    if (!firstPostPath) {
      throw new Error("No posts found in _posts");
    }

    const parsed = parsePost(firstPostPath);
    const slug = String(parsed.data.slug || "");
    if (!slug) {
      throw new Error(`${firstPostPath} is missing slug front matter`);
    }

    const post = load(readBuilt(`posts/${slug}/index.html`));
    const title = post("meta[property='og:title']").attr("content") || "";
    const description = post("meta[name='description']").attr("content") || "";

    expect(title).toContain(String(parsed.data.title || ""));
    expect(description.length).toBeGreaterThan(0);
    expect(description).toBe(post("meta[property='og:description']").attr("content") || "");
    expect(post("meta[property='og:type']").attr("content")).toBe("article");
    expect(post("meta[property='og:image']").attr("content") || "").toContain("/assets/images/og-default.png");
  });
});
