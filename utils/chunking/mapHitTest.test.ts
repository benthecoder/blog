import { readFileSync } from "node:fs";
import { scaleLinear } from "d3-scale";
import { describe, expect, it } from "vitest";
import { KNOWLEDGE_MAP_NODES_JSON } from "@/config/paths";
import type { ArticleNode, KnowledgeMapPreview } from "@/types/knowledgeMap";
import { findNearestMapNode } from "./mapHitTest";

// Reference the original canvas algorithm to catch changes in hover/click selection.
function originalHitTest(
  nodes: ArticleNode[],
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const sx = scaleLinear().domain([0, 1000]).range([0, width]);
  const sy = scaleLinear().domain([0, 1000]).range([0, height]);
  let closest: ArticleNode | null = null;
  let minDistance = radius;
  for (const node of nodes) {
    const distance = Math.sqrt((sx(node.x) - x) ** 2 + (sy(node.y) - y) ** 2);
    if (distance < minDistance) {
      minDistance = distance;
      closest = node;
    }
  }
  return closest;
}

const node = (id: string, x: number, y: number): ArticleNode => ({
  id,
  x,
  y,
  postSlug: id,
  postTitle: id,
  wordCount: 1,
  tags: [],
  cluster: 0,
});

describe("map hit testing", () => {
  it("preserves first-node ties, strict radius boundaries, and unclamped coordinates", () => {
    const nodes = [
      node("first", 500, 500),
      node("tie", 500, 500),
      node("outside", -100, 1100),
    ];
    const viewport = { width: 1000, height: 1000 };
    expect(
      findNearestMapNode(nodes, { x: 500, y: 500 }, viewport, 12)?.id
    ).toBe("first");
    expect(
      findNearestMapNode(nodes, { x: 512, y: 500 }, viewport, 12)
    ).toBeNull();
    expect(
      findNearestMapNode(nodes, { x: -100, y: 1100 }, viewport, 12)?.id
    ).toBe("outside");
    expect(
      findNearestMapNode(nodes, { x: 500, y: 500 }, viewport, 0)
    ).toBeNull();
    expect(findNearestMapNode([], { x: 500, y: 500 }, viewport, 12)).toBeNull();
  });

  it("selects the same articles as the original algorithm across the committed map", () => {
    const { data } = JSON.parse(
      readFileSync(KNOWLEDGE_MAP_NODES_JSON, "utf8")
    ) as KnowledgeMapPreview;
    expect(data.length).toBeGreaterThan(0);
    for (const viewport of [
      { width: 390, height: 600 },
      { width: 1440, height: 720 },
    ]) {
      for (const radius of [12, 24]) {
        const points = data.map((n) => ({
          x: (n.x / 1000) * viewport.width + 3,
          y: (n.y / 1000) * viewport.height - 2,
        }));
        for (let x = 0; x <= viewport.width; x += viewport.width / 20) {
          for (let y = 0; y <= viewport.height; y += viewport.height / 20)
            points.push({ x, y });
        }
        for (const point of points) {
          expect(findNearestMapNode(data, point, viewport, radius)?.id).toBe(
            originalHitTest(
              data,
              point.x,
              point.y,
              viewport.width,
              viewport.height,
              radius
            )?.id
          );
        }
      }
    }
  });
});
