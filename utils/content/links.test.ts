import { describe, expect, it, vi } from "vitest";

vi.mock("./markdown", () => ({
  scanMarkdownDir: (directory: string) =>
    directory.endsWith("wiki")
      ? [
          {
            slug: "attention",
            data: { title: "Attention" },
            content: "Wiki body retained on server. [[Jazz practice]]",
          },
        ]
      : [
          {
            slug: "jazz",
            data: { title: "Jazz practice" },
            content: "Post body retained on server. [[Attention]]",
          },
          {
            slug: "collision",
            data: { title: "Attention" },
            content: "Another post body.",
          },
        ],
}));
import { getLinkIndex, getLinkGraph, getBacklinks } from "./links";

describe("public link metadata", () => {
  it("serializes metadata without Markdown bodies", () => {
    const index = getLinkIndex();
    for (const entry of index.entries)
      expect(Object.keys(entry).sort()).toEqual(["href", "ref", "title"]);
    expect(JSON.stringify(index.entries)).not.toContain("retained on server");
    expect(index.entries).toHaveLength(3);
  });
  it("preserves wiki-first resolution, including slug fallback", () => {
    const index = getLinkIndex();
    expect(index.resolve(" Attention ")?.ref).toEqual({
      kind: "wiki",
      slug: "attention",
    });
    expect(index.resolve("JAZZ")?.href).toBe("/posts/jazz");
    expect(index.resolve("missing")).toBeNull();
    expect(index.resolve("Attention")).not.toHaveProperty("content");
  });
  it("still derives outlinks and backlinks from the retained server bodies", () => {
    const graph = getLinkGraph();
    expect(graph.outlinks({ kind: "wiki", slug: "attention" })).toEqual([
      {
        ref: { kind: "post", slug: "jazz" },
        title: "Jazz practice",
        href: "/posts/jazz",
      },
    ]);
    expect(getBacklinks({ kind: "post", slug: "jazz" })).toEqual([
      {
        ref: { kind: "wiki", slug: "attention" },
        title: "Attention",
        href: "/wiki/attention",
      },
    ]);
    expect(
      graph.backlinks({ kind: "wiki", slug: "attention" })[0]
    ).not.toHaveProperty("content");
  });
});
