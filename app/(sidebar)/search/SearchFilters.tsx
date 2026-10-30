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
const filterClass = (selected: boolean) =>
  `py-1 underline-offset-4 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4 ${
    selected
      ? "text-primary underline decoration-accent/60"
      : "text-muted hover:text-accent"
  }`;

export default function SearchFilters({
  searchType,
  onSearchTypeChange,
  selectedChunkType,
  onChunkTypeChange,
  onClearFilters,
}: SearchFiltersProps) {
  return (
    <div className="mb-8 space-y-2 text-sm">
      <div
        role="group"
        aria-label="Search type"
        className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-baseline gap-x-4"
      >
        <span aria-hidden="true" className="w-14 text-xs text-muted">
          match
        </span>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {(["hybrid", "semantic", "keyword"] as const).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={searchType === type}
              onClick={() => onSearchTypeChange(type)}
              className={filterClass(searchType === type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      <div
        role="group"
        aria-label="Content type"
        className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-baseline gap-x-4"
      >
        <span aria-hidden="true" className="w-14 text-xs text-muted">
          show
        </span>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <button
            type="button"
            aria-pressed={selectedChunkType === ""}
            onClick={() => onChunkTypeChange("")}
            className={filterClass(selectedChunkType === "")}
          >
            all
          </button>
          {CHUNK_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={selectedChunkType === type}
              onClick={() => onChunkTypeChange(type)}
              className={filterClass(selectedChunkType === type)}
            >
              {formatChunkTypeLabel(type)}
            </button>
          ))}
          {selectedChunkType && (
            <button
              type="button"
              onClick={onClearFilters}
              className="py-1 text-xs text-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4"
            >
              reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
