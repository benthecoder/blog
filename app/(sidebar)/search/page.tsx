"use client";

import { useState, useEffect, Suspense } from "react";
import type { FormEvent } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";
import SearchResult from "./SearchResult";
import SearchFilters from "./SearchFilters";
import type { SearchResultItem, SearchType } from "@/types/search";
import type { ChunkType } from "@/types/chunks";

function SearchContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>("hybrid");
  const [selectedChunkType, setSelectedChunkType] = useState<ChunkType | "">(
    ""
  );

  // Restore query/results from sessionStorage after hydration. Lazy
  // initializers would touch sessionStorage during SSR or mismatch the
  // server HTML, so a mount effect is the right tool here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    const urlChunkType = searchParams.get("chunkType");

    setQuery(urlQuery || sessionStorage.getItem("lastQuery") || "");

    if (urlChunkType) {
      setSelectedChunkType(urlChunkType as ChunkType);
    }

    const cached = sessionStorage.getItem("searchResults");
    if (cached) setResults(JSON.parse(cached));

    setHasSearched(sessionStorage.getItem("hasSearched") === "true");
    // mount-only: intentionally not re-running on searchParams changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Takes explicit filter values so filter-change handlers can search with
  // the new value immediately instead of waiting a render for state.
  const performSearch = async (type: SearchType, chunkType: ChunkType | "") => {
    if (!query.trim()) return;

    const params = new URLSearchParams();
    params.set("q", query.trim());
    if (chunkType) {
      params.set("chunkType", chunkType);
    }
    replace(`${pathname}?${params.toString()}`);

    sessionStorage.setItem("lastQuery", query.trim());
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          searchType: type,
          chunkType: chunkType || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Search failed: ${data.error || response.statusText}`);
      }

      if (!data.results || !Array.isArray(data.results)) {
        setResults([]);
        return;
      }

      setResults(data.results);
      sessionStorage.setItem("searchResults", JSON.stringify(data.results));
      setHasSearched(true);
      sessionStorage.setItem("hasSearched", "true");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Search failed";
      setError(errorMessage);
      setHasSearched(true);
      sessionStorage.setItem("hasSearched", "true");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e?: FormEvent) => {
    if (e) e.preventDefault();
    performSearch(searchType, selectedChunkType);
  };

  const handleSearchTypeChange = (type: SearchType) => {
    setSearchType(type);
    if (query.trim()) {
      setResults([]);
      performSearch(type, selectedChunkType);
    }
  };

  const handleChunkTypeChange = (chunkType: ChunkType | "") => {
    setSelectedChunkType(chunkType);
    if (query.trim()) {
      setResults([]);
      performSearch(searchType, chunkType);
    }
  };

  const clearFilters = () => {
    setSelectedChunkType("");
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search..."
            className="w-full px-4 py-3 bg-paper dark:bg-night border-2 border-rule dark:border-night-raised focus:border-ink dark:focus:border-chalk-soft transition-colors text-ink-strong dark:text-chalk-strong text-lg font-medium placeholder-ink-strong/40 dark:placeholder-chalk-strong/40 outline-hidden selection:bg-ink selection:text-white dark:selection:bg-chalk-soft dark:selection:text-night"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setHasSearched(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-strong/40 dark:text-chalk-strong/40 hover:text-ink dark:hover:text-chalk-soft transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </form>

      <SearchFilters
        searchType={searchType}
        onSearchTypeChange={handleSearchTypeChange}
        selectedChunkType={selectedChunkType}
        onChunkTypeChange={handleChunkTypeChange}
        onClearFilters={clearFilters}
      />

      {isLoading && (
        <div className="py-8">
          <Loader text="scavenging the archives..." size="md" />
        </div>
      )}
      {error && (
        <div className="text-red-500 dark:text-red-400 mb-4 p-4 border-l-2 border-red-500">
          {error}
        </div>
      )}

      {results.length > 0 ? (
        <div>
          <div className="mb-4 pb-2 border-b border-rule dark:border-night-raised">
            <p className="text-xs text-ink-strong/60 dark:text-chalk-strong/60 tracking-wide">
              {results.length} RESULTS
            </p>
          </div>
          <div className="space-y-4">
            {results.map((result, index) => (
              <SearchResult
                key={`${result.post_slug}-${result.chunk_type}-${index}`}
                result={result}
                query={query}
              />
            ))}
          </div>
        </div>
      ) : (
        !isLoading &&
        hasSearched &&
        query && (
          <div className="text-center py-12 border border-rule dark:border-night-raised">
            <p className="text-ink-strong/70 dark:text-chalk-strong/70 mb-2">
              No results found for &quot;{query}&quot;
            </p>
            {selectedChunkType && (
              <button
                onClick={clearFilters}
                className="mt-4 text-xs text-ink dark:text-chalk-soft hover:underline"
              >
                clear filters
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Loader text="loading search..." size="md" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
