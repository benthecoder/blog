import EmbeddingsViz from '../../components/EmbeddingsViz';

export default function VisualizationPage() {
  return (
    <div>
      <h1 className="font-bold text-left mb-6 text-2xl hover:text-light-accent dark:hover:text-dark-accent transition-colors">
        Knowledge Constellation
      </h1>

      <div className="mb-6">
        <p className="text-japanese-sumiiro dark:text-japanese-murasakisuishiyou text-sm mb-4 font-medium">
          Explore your articles as a beautiful constellation of stars. Each star represents an article, 
          with brightness reflecting its depth and colors indicating topics. Related articles form 
          subtle constellations across your knowledge universe.
        </p>
      </div>
      
      <div className="h-[75vh] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black shadow-sm">
        <EmbeddingsViz className="w-full h-full" />
      </div>
    </div>
  );
}
