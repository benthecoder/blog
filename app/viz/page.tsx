import KnowledgeMap from "@/components/visualizations/KnowledgeMap";

export const metadata = {
  title: "knowledge map",
  description: "semantic relationships across my writing",
};

export default function VisualizationPage() {
  return (
    <div>
      <h1 className="font-bold text-left mb-6 text-2xl hover:text-light-accent dark:hover:text-dark-accent transition-colors">
        knowledge map
      </h1>

      <div className="h-[75vh] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
        <KnowledgeMap className="w-full h-full" />
      </div>
    </div>
  );
}
