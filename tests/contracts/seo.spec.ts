import fs from "node:fs";
import path from "node:path";

import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { ensureBuiltSite, existsInRepo, listPosts, loadYaml, parsePost, readBuilt, ROOT } from "./helpers";

type SiteConfig = {
  baseurl?: string;
  description?: string;
  title?: string;
  url: string;
};

describe("seo and metadata contracts", () => {
  const config = loadYaml("_config.yml") as SiteConfig;
  const siteTitle = String(config.title || "");
  const siteDescription = String(config.description || "");
  const siteUrlOrigin = String(config.url || "").replace(/\/+$/, "");
  const basePath = String(config.baseurl || "")
    .replace(/^\/+/, "/")
    .replace(/\/+$/, "");
  const homeFrontMatter = parsePost("index.md");
  const homeTitle = String(homeFrontMatter.data.title || siteTitle);
  const homeDescription = String(homeFrontMatter.data.description || siteDescription);
  const normalizeTypography = (value: string): string => value.replace(/[’]/g, "'");
  const normalizeLoose = (value: string): string =>
    value
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  const canonicalFor = (pathValue: string): string => {
    const normalizedPath = `/${pathValue}`.replace(/\/{2,}/g, "/").replace(/\/?$/, "/");
    return `${siteUrlOrigin}${`${basePath}${normalizedPath}`.replace(/\/{2,}/g, "/")}`;
  };

  const requiredRoutes = [
    "index.html",
    "posts/index.html",
    "tags/index.html",
    "subscribe/index.html",
    "subscribe/confirmed/index.html",
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
    expect(siteUrlOrigin.startsWith("https://")).toBe(true);
    const configuredHostname = new URL(`${siteUrlOrigin}/`).hostname;
    expect(fs.readFileSync(path.join(ROOT, "CNAME"), "utf8").trim()).toBe(configuredHostname);
  });

  it("emits canonical links on key pages", () => {
    ensureBuiltSite();

    const home = load(readBuilt("index.html"));
    const posts = load(readBuilt("posts/index.html"));

    expect(home("link[rel='canonical']").attr("href")).toBe(canonicalFor("/"));
    expect(posts("link[rel='canonical']").attr("href")).toBe(canonicalFor("/posts/"));
  });

  it("uses site branding for homepage social titles", () => {
    ensureBuiltSite();

    const home = load(readBuilt("index.html"));
    const ogTitle = home("meta[property='og:title']").attr("content") || "";
    const twitterTitle = home("meta[property='twitter:title']").attr("content") || "";
    const description = home("meta[name='description']").attr("content") || "";

    expect(home("title").first().text()).toBe(homeTitle);
    expect(normalizeLoose(ogTitle)).toContain(normalizeLoose(siteTitle));
    expect(normalizeLoose(ogTitle)).toContain(normalizeLoose(homeTitle));
    expect(twitterTitle).toBe(ogTitle);
    expect(normalizeTypography(description)).toBe(normalizeTypography(homeDescription));
  });

  it("does not emit social image tags unless a page opts in with image metadata", () => {
    ensureBuiltSite();

    const routesWithoutDefaultImages = [
      "index.html",
      "posts/index.html",
      "tags/index.html",
      "subscribe/index.html",
      "subscribe/confirmed/index.html",
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
      "subscribe/confirmed/index.html",
      "subscribe/success/index.html",
      "privacy/index.html",
      "404.html"
    ];

    for (const route of routes) {
      const page = load(readBuilt(route));
      const ogTitle = page("meta[property='og:title']").attr("content") || "";
      const twitterTitle = page("meta[property='twitter:title']").attr("content") || "";

      if (siteTitle) {
        const suffix = ` | ${siteTitle}`;
        expect(ogTitle.endsWith(suffix), `${route} should append site name in og:title`).toBe(true);
        expect(twitterTitle.endsWith(suffix), `${route} should append site name in twitter:title`).toBe(true);
      } else {
        expect(ogTitle.length, `${route} is missing og:title`).toBeGreaterThan(0);
        expect(twitterTitle.length, `${route} is missing twitter:title`).toBeGreaterThan(0);
      }
    }
  });

  it("normalizes posts page 1 route with noindex and canonical", () => {
    ensureBuiltSite();

    const pageOne = load(readBuilt("posts/page/1/index.html"));
    expect(pageOne("meta[name='robots']").attr("content") || "").toContain("noindex");
    expect(pageOne("link[rel='canonical']").attr("href")).toBe("/posts/");
  });

  it("marks utility subscription confirmation pages noindex and out of sitemap", () => {
    ensureBuiltSite();

    const confirmed = load(readBuilt("subscribe/confirmed/index.html"));
    const success = load(readBuilt("subscribe/success/index.html"));
    const sitemap = readBuilt("sitemap.xml");

    expect(confirmed("meta[name='robots']").attr("content") || "").toContain("noindex");
    expect(success("meta[name='robots']").attr("content") || "").toContain("noindex");
    expect(sitemap.includes("/subscribe/confirmed/")).toBe(false);
    expect(sitemap.includes("/subscribe/success/")).toBe(false);
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
    const twitterTitle = post("meta[property='twitter:title']").attr("content") || "";
    const documentTitle = post("title").first().text();
    const description = post("meta[name='description']").attr("content") || "";
    const jsonLdRaw = post("script[type='application/ld+json']").first().text();
    const jsonLd = JSON.parse(jsonLdRaw) as { headline?: string };
    const expectedTitle = String(parsed.data.title || "");
    const expectedSummary = String(parsed.data.summary || "");

    expect(title).toContain(expectedTitle);
    if (siteTitle) {
      expect(title.endsWith(` | ${siteTitle}`)).toBe(true);
    }
    expect(twitterTitle).toBe(title);
    expect(documentTitle).toBe(siteTitle ? `${expectedTitle} | ${siteTitle}` : expectedTitle);
    expect(jsonLd.headline).toBe(expectedTitle);
    if (expectedSummary.length > 0) {
      expect(normalizeTypography(description)).toBe(normalizeTypography(expectedSummary));
    } else {
      expect(description.length).toBeGreaterThan(0);
    }
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
