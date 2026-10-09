import { describe, expect, it } from "vitest";
import { splitKnowledgeMap } from "./mapAssets";
import type { KnowledgeMapOutput } from "@/types/knowledgeMap";

const map: KnowledgeMapOutput = {
  success: true,
  data: [
    {
      id: "a",
      postSlug: "first",
      postTitle: "first",
      wordCount: 20,
      tags: [],
      x: 10,
      y: 20,
      cluster: 0,
    },
    {
      id: "b",
      postSlug: "second",
      postTitle: "second",
      wordCount: 30,
      tags: [],
      x: 30,
      y: 40,
      cluster: 0,
    },
  ],
  similarityEdges: [[0, 1, 0.91]],
  count: 2,
  numClusters: 1,
  clusterLabels: { 0: "notes" },
  generatedAt: "2026-10-06T00:00:00.000Z",
};

describe("knowledge map browser assets", () => {
  it("preserves every node and edge without sending edges initially", () => {
    const original = JSON.stringify(map);
    const { previewJson, edgesJson, edgesFilename } = splitKnowledgeMap(map);
    const preview = JSON.parse(previewJson);
    expect(preview.data).toEqual(map.data);
    expect(preview.clusterLabels).toEqual(map.clusterLabels);
    expect(preview.count).toBe(map.count);
    expect(preview.similarityEdges).toBeUndefined();
    expect(preview.similarityEdgesUrl).toBe(`/data/${edgesFilename}`);
    expect(JSON.parse(edgesJson)).toEqual(map.similarityEdges);
    expect(JSON.stringify(map)).toBe(original);
  });
  it("uses stable content-addressed connections across metadata-only rebuilds", () => {
    const first = splitKnowledgeMap(map);
    const metadataChange = splitKnowledgeMap({ ...map, generatedAt: "later" });
    expect(metadataChange.edgesFilename).toBe(first.edgesFilename);
    const changedEdges = splitKnowledgeMap({
      ...map,
      similarityEdges: [[0, 1, 0.95]],
    });
    expect(changedEdges.edgesFilename).not.toBe(first.edgesFilename);
    expect(first.edgesFilename).toMatch(
      /^knowledge-map-edges-[a-f0-9]{64}\.json$/
    );
  });
  it("produces valid assets for a map with no connections", () => {
    const assets = splitKnowledgeMap({ ...map, similarityEdges: [] });
    expect(JSON.parse(assets.edgesJson)).toEqual([]);
    expect(JSON.parse(assets.previewJson).data).toEqual(map.data);
  });
  it("ships summaries as a separate content-addressed file", () => {
    const withSummaries = { ...map, summaries: { first: "about firsts" } };
    const assets = splitKnowledgeMap(withSummaries);
    const preview = JSON.parse(assets.previewJson);
    expect(preview.summaries).toBeUndefined();
    expect(preview.summariesUrl).toBe(`/data/${assets.summariesFilename}`);
    expect(JSON.parse(assets.summariesJson!)).toEqual(withSummaries.summaries);
    expect(assets.summariesFilename).toMatch(
      /^knowledge-map-summaries-[a-f0-9]{64}\.json$/
    );
    expect(splitKnowledgeMap(map).summariesFilename).toBeUndefined();
  });
});
