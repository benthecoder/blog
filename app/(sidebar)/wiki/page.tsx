import { getWikiGraph } from "@/utils/content/wikiGraph";
import WikiGraph from "@/components/visualizations/WikiGraph";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "wiki",
  description: "A directory of things I've written up",
};

const WikiPage = () => {
  const graph = getWikiGraph();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {graph.nodes.length === 0 ? (
        <p className="text-sm text-primary/60">Nothing here yet.</p>
      ) : (
        <WikiGraph data={graph} className="h-[78vh] w-full" />
      )}
    </div>
  );
};

export default WikiPage;
