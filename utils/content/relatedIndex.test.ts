import { describe, expect, it } from "vitest";
import { buildRelatedIndex } from "./relatedIndex";
import type { KnowledgeMapOutput } from "@/types/knowledgeMap";
import fs from "node:fs";
import { KNOWLEDGE_MAP_JSON } from "@/config/paths";

function reference(map: KnowledgeMapOutput, limit: number) {
  const index = new Map<
    string,
    { slug: string; title: string; similarity: number }[]
  >();
  for (const [a, b, similarity] of map.similarityEdges) {
    for (const [from, to] of [
      [a, b],
      [b, a],
    ]) {
      const source = map.data[from],
        target = map.data[to];
      if (!source || !target || source.postSlug === target.postSlug) continue;
      const posts = index.get(source.postSlug) ?? [];
      posts.push({
        slug: target.postSlug,
        title: target.postTitle,
        similarity,
      });
      index.set(source.postSlug, posts);
    }
  }
  for (const [slug, posts] of index)
    index.set(
      slug,
      posts.sort((a, b) => b.similarity - a.similarity).slice(0, limit)
    );
  return index;
}
describe("bounded related-post index", () => {
  it("preserves every current recommendation and order against the previous algorithm", () => {
    const map: KnowledgeMapOutput = JSON.parse(
      fs.readFileSync(KNOWLEDGE_MAP_JSON, "utf8")
    );
    const index = buildRelatedIndex(map);
    expect(index).toEqual(reference(map, 4));
    expect([...index.values()].every((posts) => posts.length <= 4)).toBe(true);
  });
  it("keeps stable tie order and omits missing/self connections", () => {
    const nodes = Array.from({ length: 7 }, (_, i) => ({
      id: String(i),
      postSlug: String(i),
      postTitle: String(i),
      wordCount: 1,
      tags: [],
      x: 0,
      y: 0,
      cluster: 0,
    }));
    const map: KnowledgeMapOutput = {
      success: true,
      data: nodes,
      similarityEdges: [
        [0, 1, 0.8],
        [0, 2, 0.8],
        [0, 3, 0.9],
        [0, 4, 0.95],
        [0, 5, 0.8],
        [0, 6, 0.99],
        [0, 0, 1],
        [0, 9, 1],
      ],
      count: 7,
      numClusters: 1,
      generatedAt: "test",
    };
    expect(buildRelatedIndex(map)).toEqual(reference(map, 4));
    expect(
      buildRelatedIndex(map)
        .get("0")
        ?.map((post) => post.slug)
    ).toEqual(["6", "4", "3", "1"]);
    expect(buildRelatedIndex(map, 6)).toEqual(reference(map, 6));
  });
  it("handles an empty graph", () => {
    expect(
      buildRelatedIndex({
        success: true,
        data: [],
        similarityEdges: [],
        count: 0,
        numClusters: 0,
        generatedAt: "test",
      }).size
    ).toBe(0);
  });
});
