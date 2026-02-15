import { describe, expect, it } from "vitest";

import { loadYaml, readRepoFile } from "./helpers";

describe("code highlighting contract", () => {
  it("uses rouge with line numbers", () => {
    const config = loadYaml("_config.yml") as {
      kramdown: {
        syntax_highlighter: string;
        syntax_highlighter_opts: {
          block: { line_numbers: boolean };
        };
      };
    };

    expect(config.kramdown.syntax_highlighter).toBe("rouge");
    expect(config.kramdown.syntax_highlighter_opts.block.line_numbers).toBe(true);
  });

  it("defines monokai-inspired token palette", () => {
    const css = readRepoFile("assets/css/main.css");

    expect(css).toContain("--code-keyword");
    expect(css).toContain("--code-string");
    expect(css).toContain("--code-number");
    expect(css).toContain("--code-function");
    expect(css).toContain("--code-type");
    expect(css).toContain("--code-meta");
  });

  it("includes code-copy behavior and avoids hand-authored syntax spans", () => {
    const codeCopy = readRepoFile("assets/js/code-copy.js");
    expect(codeCopy).toContain("code-copy-button");
    expect(codeCopy).toContain("Copy");

    const postLayout = readRepoFile("_layouts/post.html");
    expect(postLayout).not.toMatch(/hljs-|token\s+/);
  });
});
