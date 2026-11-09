import type { Metadata } from "next";
import KnowledgeMap from "@/components/visualizations/KnowledgeMap";
import { pageMetadata } from "@/utils/pageMetadata";

export const metadata: Metadata = pageMetadata({
  title: "connections",
  description: "Every entry in this notebook, placed by what it is about.",
  path: "/connections",
});

export default function ConnectionsPage() {
  return (
    <div>
      <h1 className="mb-2 text-base font-bold text-primary">connections</h1>
      <p className="mb-6 text-sm text-muted">
        explore how the entries in this notebook connect.
      </p>
      <div className="min-h-[27rem] sm:min-h-[33rem]">
        <KnowledgeMap className="w-full" />
      </div>
    </div>
  );
}
