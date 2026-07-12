import { describe, expect, it } from "vitest";
import { extractToc } from "./toc";

describe("extractToc", () => {
  it("extracts h2 and h3 headings with github slugs", () => {
    const md = "# Title\n\n## First Section\n\ntext\n\n### Sub Thing\n";
    expect(extractToc(md)).toEqual([
      { id: "first-section", text: "First Section", depth: 2 },
      { id: "sub-thing", text: "Sub Thing", depth: 3 },
    ]);
  });

  it("ignores headings inside fenced code blocks", () => {
    const md = "## Real\n\n```md\n## Not a heading\n```\n\n## Also Real\n";
    expect(extractToc(md).map((e) => e.text)).toEqual(["Real", "Also Real"]);
  });

  it("strips inline markdown from heading text", () => {
    const md = "## Using `pnpm` with **force**\n\n## [A link](https://x.com)\n";
    expect(extractToc(md)).toEqual([
      { id: "using-pnpm-with-force", text: "Using pnpm with force", depth: 2 },
      { id: "a-link", text: "A link", depth: 2 },
    ]);
  });

  it("deduplicates repeated headings like github-slugger", () => {
    const md = "## Notes\n\n## Notes\n";
    expect(extractToc(md).map((e) => e.id)).toEqual(["notes", "notes-1"]);
  });

  it("ignores h1 and h4+", () => {
    const md = "# Top\n\n#### Deep\n\n## Kept\n";
    expect(extractToc(md).map((e) => e.text)).toEqual(["Kept"]);
  });
});
