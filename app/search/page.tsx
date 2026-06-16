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

  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    const params = new URLSearchParams();
    params.set("q", query.trim());
    if (selectedChunkType) {
      params.set("chunkType", selectedChunkType);
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
          searchType,
          chunkType: selectedChunkType || undefined,
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

  const clearFilters = () => {
    setSelectedChunkType("");
    setResults([]);
    setHasSearched(false);
  };

  useEffect(() => {
    if (query.trim()) {
      setResults([]);
      handleSearch();
    }
    // intentionally re-runs only when filter changes, not on every handleSearch re-creation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchType, selectedChunkType]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search..."
            className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg border-2 border-light-border dark:border-dark-tag focus:border-light-accent dark:focus:border-dark-accent transition-colors text-light-text dark:text-dark-text text-lg font-medium placeholder-light-text/40 dark:placeholder-dark-text/40 outline-none selection:bg-light-accent selection:text-white dark:selection:bg-dark-accent dark:selection:text-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setHasSearched(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text/40 dark:text-dark-text/40 hover:text-light-accent dark:hover:text-dark-accent transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </form>

      <SearchFilters
        searchType={searchType}
        onSearchTypeChange={setSearchType}
        selectedChunkType={selectedChunkType}
        onChunkTypeChange={setSelectedChunkType}
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
          <div className="mb-4 pb-2 border-b border-light-border dark:border-dark-tag">
            <p className="text-xs text-light-text/60 dark:text-dark-text/60 tracking-wide">
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
          <div className="text-center py-12 border border-light-border dark:border-dark-tag">
            <p className="text-light-text/70 dark:text-dark-text/70 mb-2">
              No results found for &quot;{query}&quot;
            </p>
            {selectedChunkType && (
              <button
                onClick={clearFilters}
                className="mt-4 text-xs text-light-accent dark:text-dark-accent hover:underline"
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
