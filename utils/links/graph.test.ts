import { describe, it, expect } from "vitest";
import { buildLinkGraph } from "./graph";
import type { ContentRef, LinkableEntry } from "@/types/links";

const wiki = (slug: string, title: string): LinkableEntry => ({
  ref: { kind: "wiki", slug },
  title,
  href: `/wiki/${slug}`,
});

describe("buildLinkGraph", () => {
  const entries = [wiki("a", "Alpha"), wiki("b", "Beta"), wiki("c", "Gamma")];
  const content: Record<string, string> = {
    a: "links to [[Beta]] and [[Gamma]]",
    b: "back to [[Alpha]]",
    c: "no links",
  };
  const get = (ref: ContentRef) => content[ref.slug] ?? "";
  const graph = buildLinkGraph(entries, get);

  it("records outgoing links", () => {
    expect(
      graph.outlinks({ kind: "wiki", slug: "a" }).map((e) => e.ref.slug)
    ).toEqual(["b", "c"]);
  });

  it("derives backlinks (reverse adjacency)", () => {
    expect(
      graph.backlinks({ kind: "wiki", slug: "b" }).map((e) => e.ref.slug)
    ).toEqual(["a"]);
    expect(
      graph.backlinks({ kind: "wiki", slug: "a" }).map((e) => e.ref.slug)
    ).toEqual(["b"]);
  });

  it("returns empty arrays for pages with no edges", () => {
    expect(graph.outlinks({ kind: "wiki", slug: "c" })).toEqual([]);
    expect(
      graph.backlinks({ kind: "wiki", slug: "c" }).map((e) => e.ref.slug)
    ).toEqual(["a"]);
  });

  it("ignores unresolved links", () => {
    const g = buildLinkGraph([wiki("a", "Alpha")], () => "[[Nonexistent]]");
    expect(g.outlinks({ kind: "wiki", slug: "a" })).toEqual([]);
  });

  it("drops self-links", () => {
    const g = buildLinkGraph(
      [wiki("a", "Alpha")],
      () => "[[Alpha]] loves [[Alpha]]"
    );
    expect(g.outlinks({ kind: "wiki", slug: "a" })).toEqual([]);
    expect(g.backlinks({ kind: "wiki", slug: "a" })).toEqual([]);
  });

  it("dedupes a target linked multiple times", () => {
    const g = buildLinkGraph([wiki("a", "Alpha"), wiki("b", "Beta")], (ref) =>
      ref.slug === "a" ? "[[Beta]] [[Beta]] [[b]]" : ""
    );
    expect(
      g.outlinks({ kind: "wiki", slug: "a" }).map((e) => e.ref.slug)
    ).toEqual(["b"]);
  });
});
