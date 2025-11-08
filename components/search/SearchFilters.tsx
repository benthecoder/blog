import { formatChunkTypeLabel } from "@/utils/searchHelpers";

interface SearchFiltersProps {
  searchType: "hybrid" | "semantic" | "keyword";
  onSearchTypeChange: (type: "hybrid" | "semantic" | "keyword") => void;
  selectedChunkType: string;
  onChunkTypeChange: (type: string) => void;
  onClearFilters: () => void;
}

const CHUNK_TYPES = ["code", "full-post", "quote", "section"];

export default function SearchFilters({
  searchType,
  onSearchTypeChange,
  selectedChunkType,
  onChunkTypeChange,
  onClearFilters,
}: SearchFiltersProps) {
  return (
    <div className="mb-8 space-y-4">
      {/* Search Type Filter */}
      <div className="border-t border-light-border dark:border-dark-tag pt-4">
        <label className="block text-xs font-medium text-light-text/70 dark:text-dark-text/70 mb-2 tracking-wide">
          SEARCH TYPE
        </label>
        <div className="flex flex-wrap gap-2">
          {(["hybrid", "semantic", "keyword"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onSearchTypeChange(type)}
              className={`px-3 py-1.5 text-sm border transition-all ${
                searchType === type
                  ? "border-light-accent dark:border-dark-accent bg-light-accent/20 dark:bg-dark-accent/20 text-[#595857] dark:text-[#DCDDDD] font-medium"
                  : "border-light-border dark:border-dark-tag text-light-text/60 dark:text-dark-text/60 hover:border-light-accent/50 dark:hover:border-dark-accent/50"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Content Type Filter */}
      <div className="pt-4">
        <label className="block text-xs font-medium text-light-text/70 dark:text-dark-text/70 mb-2 tracking-wide">
          CONTENT TYPE
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChunkTypeChange("")}
            className={`px-3 py-1.5 text-sm border transition-all ${
              selectedChunkType === ""
                ? "border-light-accent dark:border-dark-accent bg-light-accent/20 dark:bg-dark-accent/20 text-[#595857] dark:text-[#DCDDDD] font-medium"
                : "border-light-border dark:border-dark-tag text-light-text/60 dark:text-dark-text/60 hover:border-light-accent/50 dark:hover:border-dark-accent/50"
            }`}
          >
            all
          </button>
          {CHUNK_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChunkTypeChange(type)}
              className={`px-3 py-1.5 text-sm border transition-all ${
                selectedChunkType === type
                  ? "border-light-accent dark:border-dark-accent bg-light-accent/20 dark:bg-dark-accent/20 text-[#595857] dark:text-[#DCDDDD] font-medium"
                  : "border-light-border dark:border-dark-tag text-light-text/60 dark:text-dark-text/60 hover:border-light-accent/50 dark:hover:border-dark-accent/50"
              }`}
            >
              {formatChunkTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Clear filters button */}
      {selectedChunkType && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs text-light-text/50 dark:text-dark-text/50 hover:text-light-accent dark:hover:text-dark-accent transition-colors"
          >
            clear filters
          </button>
        </div>
      )}
    </div>
  );
}
