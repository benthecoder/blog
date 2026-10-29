import type { Metadata } from "next";
import KnowledgeMap3D from "@/components/visualizations/KnowledgeMap3D";
import { getKnowledgeMap3d } from "@/utils/content/knowledgeMap3d";
import { pageMetadata } from "@/utils/pageMetadata";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "explore",
  description: "Every post, placed by what it is about, in three dimensions.",
  path: "/explore",
});

export default function ExplorePage() {
  const { points, clusterLabels } = getKnowledgeMap3d();
  return <KnowledgeMap3D points={points} clusterLabels={clusterLabels} />;
}
