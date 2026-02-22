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

  it("uses site branding for homepage social titles", () => {
    ensureBuiltSite();

    const home = load(readBuilt("index.html"));
    expect(home("meta[property='og:title']").attr("content")).toBe("Stuff of Thoughts");
    expect(home("meta[property='twitter:title']").attr("content")).toBe("Stuff of Thoughts");
  });

  it("does not emit social image tags unless a page opts in with image metadata", () => {
    ensureBuiltSite();

    const routesWithoutDefaultImages = [
      "index.html",
      "posts/index.html",
      "tags/index.html",
      "subscribe/index.html",
      "subscribe/success/index.html",
      "privacy/index.html",
      "404.html"
    ];

    for (const route of routesWithoutDefaultImages) {
      const page = load(readBuilt(route));
      expect(page("meta[property='og:image']").length, `${route} unexpectedly emits og:image`).toBe(0);
      expect(page("meta[property='twitter:image']").length, `${route} unexpectedly emits twitter:image`).toBe(0);
    }
  });

  it("appends site name to social titles on key non-home routes", () => {
    ensureBuiltSite();

    const routes = [
      "posts/index.html",
      "tags/index.html",
      "subscribe/index.html",
      "subscribe/success/index.html",
      "privacy/index.html",
      "404.html"
    ];

    for (const route of routes) {
      const page = load(readBuilt(route));
      const ogTitle = page("meta[property='og:title']").attr("content") || "";
      const twitterTitle = page("meta[property='twitter:title']").attr("content") || "";

      expect(ogTitle.endsWith(" | Stuff of Thoughts"), `${route} should append site name in og:title`).toBe(true);
      expect(
        twitterTitle.endsWith(" | Stuff of Thoughts"),
        `${route} should append site name in twitter:title`
      ).toBe(true);
    }
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
    expect(title.endsWith(" | Stuff of Thoughts")).toBe(true);
    expect(description.length).toBeGreaterThan(0);
    expect(description).toBe(post("meta[property='og:description']").attr("content") || "");
    expect(post("meta[property='og:type']").attr("content")).toBe("article");
    const imageData = parsed.data.image as
      | string
      | false
      | null
      | undefined
      | { path?: string; facebook?: string; twitter?: string };
    const hasImage =
      typeof imageData === "string"
        ? imageData.length > 0
        : !!imageData &&
          (typeof imageData.path === "string" ||
            typeof imageData.facebook === "string" ||
            typeof imageData.twitter === "string");

    if (hasImage) {
      expect(post("meta[property='og:image']").length).toBe(1);
      expect(post("meta[property='twitter:image']").length).toBe(1);
    } else {
      expect(post("meta[property='og:image']").length).toBe(0);
      expect(post("meta[property='twitter:image']").length).toBe(0);
    }
  });
});
