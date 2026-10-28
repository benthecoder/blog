import { getWikiGraph } from "@/utils/content/wikiGraph";
import WikiGraph from "@/components/visualizations/WikiGraph";
import type { Metadata } from "next";
import { pageMetadata } from "@/utils/pageMetadata";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "wiki",
  description: "A directory of things I've written up",
  path: "/wiki",
});

const WikiPage = () => {
  const graph = getWikiGraph();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="sr-only">wiki</h1>
      {graph.nodes.length === 0 ? (
        <p className="text-sm text-primary/60">Nothing here yet.</p>
      ) : (
        <WikiGraph data={graph} className="h-[78vh] w-full" />
      )}
    </div>
  );
};

export default WikiPage;
