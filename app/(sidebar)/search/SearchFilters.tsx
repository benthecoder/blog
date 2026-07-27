import { formatChunkTypeLabel } from "./searchHelpers";
import type { SearchType } from "@/types/search";
import type { ChunkType } from "@/types/chunks";

interface SearchFiltersProps {
  searchType: SearchType;
  onSearchTypeChange: (type: SearchType) => void;
  selectedChunkType: ChunkType | "";
  onChunkTypeChange: (type: ChunkType | "") => void;
  onClearFilters: () => void;
}

const CHUNK_TYPES: ChunkType[] = ["code", "full-post", "quote", "section"];

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
      <div className="border-t border-rule dark:border-night-raised pt-4">
        <label className="block text-xs font-medium text-ink-strong/70 dark:text-chalk-strong/70 mb-2 tracking-wide">
          SEARCH TYPE
        </label>
        <div className="flex flex-wrap gap-2">
          {(["hybrid", "semantic", "keyword"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onSearchTypeChange(type)}
              className={`px-3 py-1.5 text-sm border transition-[border-color,background-color,color] duration-150 ${
                searchType === type
                  ? "border-ink dark:border-chalk-soft bg-ink/20 dark:bg-chalk-soft/20 text-ink dark:text-chalk-strong font-medium"
                  : "border-rule dark:border-night-raised text-ink-strong/60 dark:text-chalk-strong/60 hover:border-ink/50 dark:hover:border-chalk-soft/50"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Content Type Filter */}
      <div className="pt-4">
        <label className="block text-xs font-medium text-ink-strong/70 dark:text-chalk-strong/70 mb-2 tracking-wide">
          CONTENT TYPE
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChunkTypeChange("")}
            className={`px-3 py-1.5 text-sm border transition-[border-color,background-color,color] duration-150 ${
              selectedChunkType === ""
                ? "border-ink dark:border-chalk-soft bg-ink/20 dark:bg-chalk-soft/20 text-ink dark:text-chalk-strong font-medium"
                : "border-rule dark:border-night-raised text-ink-strong/60 dark:text-chalk-strong/60 hover:border-ink/50 dark:hover:border-chalk-soft/50"
            }`}
          >
            all
          </button>
          {CHUNK_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChunkTypeChange(type)}
              className={`px-3 py-1.5 text-sm border transition-[border-color,background-color,color] duration-150 ${
                selectedChunkType === type
                  ? "border-ink dark:border-chalk-soft bg-ink/20 dark:bg-chalk-soft/20 text-ink dark:text-chalk-strong font-medium"
                  : "border-rule dark:border-night-raised text-ink-strong/60 dark:text-chalk-strong/60 hover:border-ink/50 dark:hover:border-chalk-soft/50"
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
            className="text-xs text-ink-strong/50 dark:text-chalk-strong/50 hover:text-ink dark:hover:text-chalk-soft transition-colors"
          >
            clear filters
          </button>
        </div>
      )}
    </div>
  );
}
