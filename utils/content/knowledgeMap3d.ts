import fs from "fs";
import { KNOWLEDGE_MAP_3D_JSON, KNOWLEDGE_MAP_JSON } from "@/config/paths";
import type { KnowledgeMapOutput } from "@/types/knowledgeMap";

export interface Map3dPoint {
  slug: string;
  title: string;
  cluster: number;
  date?: string;
  x: number;
  y: number;
  z: number;
}

export interface Map3dData {
  points: Map3dPoint[];
  clusterLabels: Record<number, string>;
}

/** Posts from the 2D knowledge map joined with their generated 3D coordinates. */
export function getKnowledgeMap3d(): Map3dData {
  if (
    !fs.existsSync(KNOWLEDGE_MAP_JSON) ||
    !fs.existsSync(KNOWLEDGE_MAP_3D_JSON)
  ) {
    return { points: [], clusterLabels: {} };
  }
  const map: KnowledgeMapOutput = JSON.parse(
    fs.readFileSync(KNOWLEDGE_MAP_JSON, "utf8")
  );
  const coords: { points: Record<string, [number, number, number]> } =
    JSON.parse(fs.readFileSync(KNOWLEDGE_MAP_3D_JSON, "utf8"));

  const points = map.data.flatMap((node) => {
    const at = coords.points[node.postSlug];
    if (!at) return [];
    return [
      {
        slug: node.postSlug,
        title: node.postTitle,
        cluster: node.cluster,
        date: node.publishedDate,
        x: at[0],
        y: at[1],
        z: at[2],
      },
    ];
  });
  return { points, clusterLabels: map.clusterLabels ?? {} };
}
