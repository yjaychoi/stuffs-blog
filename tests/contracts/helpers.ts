import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import fg from "fast-glob";
import matter from "gray-matter";
import YAML from "yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT = path.resolve(__dirname, "../..");

export function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

export function existsInRepo(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

export function loadYaml(relativePath: string): unknown {
  return YAML.parse(readRepoFile(relativePath));
}

export function listPosts(): string[] {
  return fg.sync("_posts/*.md", { cwd: ROOT, absolute: false }).sort();
}

export function parsePost(relativePath: string): matter.GrayMatterFile<string> {
  const source = readRepoFile(relativePath);
  return matter(source);
}

export function ensureBuiltSite(): void {
  if (!existsInRepo("_site/index.html")) {
    throw new Error("Built site not found at _site/. Run `npm run build` before contract tests.");
  }
}

export function readBuilt(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, "_site", relativePath), "utf8");
}

export function listBuiltFiles(glob: string): string[] {
  return fg.sync(glob, { cwd: path.join(ROOT, "_site"), absolute: false }).sort();
}

export function normalizeTag(tag: string): string {
  try {
    return tag.normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " ");
  } catch {
    return tag.toLowerCase().trim().replace(/\s+/g, " ");
  }
}

export function slugify(text: string): string {
  return normalizeTag(text)
    .replace(/[^\p{Letter}\p{Number}\p{Mark}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
