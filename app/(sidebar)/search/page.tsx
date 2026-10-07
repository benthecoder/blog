"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import type { FormEvent } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";
import SearchResult from "./SearchResult";
import SearchFilters from "./SearchFilters";
import type { SearchType } from "@/types/search";
import type { ChunkType } from "@/types/chunks";
import { useLatestSearch } from "@/components/hooks/useLatestSearch";

function SearchContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const { results, error, isLoading, hasSearched, execute, cancel } =
    useLatestSearch();
  const addressRef = useRef<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("hybrid");
  const [selectedChunkType, setSelectedChunkType] = useState<ChunkType | "">(
    ""
  );

  // URL state is authoritative. Cached results from another query are never restored.
  useEffect(() => {
    const address = searchParams.toString();
    if (addressRef.current === address) return;
    addressRef.current = address;
    const urlQuery = searchParams.get("q") ?? "";
    const rawType = searchParams.get("type");
    const type: SearchType =
      rawType === "keyword" || rawType === "semantic" ? rawType : "hybrid";
    const rawChunk = searchParams.get("chunkType");
    const chunk: ChunkType | "" =
      rawChunk === "full-post" ||
      rawChunk === "section" ||
      rawChunk === "quote" ||
      rawChunk === "code"
        ? rawChunk
        : "";
    cancel();
    setQuery(urlQuery);
    setSearchType(type);
    setSelectedChunkType(chunk);
    if (urlQuery.trim())
      void execute({ query: urlQuery, searchType: type, chunkType: chunk });
    return () => {
      if (addressRef.current === address) addressRef.current = null;
    };
  }, [searchParams, execute, cancel]);

  const performSearch = (type: SearchType, chunkType: ChunkType | "") => {
    if (!query.trim()) {
      cancel();
      return;
    }
    const params = new URLSearchParams({ q: query.trim(), type });
    if (chunkType) params.set("chunkType", chunkType);
    addressRef.current = params.toString();
    replace(`${pathname}?${params.toString()}`);
    void execute({ query, searchType: type, chunkType });
  };

  const clearQuery = () => {
    cancel();
    setQuery("");
    setSearchType("hybrid");
    setSelectedChunkType("");
    addressRef.current = "";
    replace(pathname);
  };

  const handleSearch = (e?: FormEvent) => {
    if (e) e.preventDefault();
    performSearch(searchType, selectedChunkType);
  };

  const handleSearchTypeChange = (type: SearchType) => {
    setSearchType(type);
    if (query.trim()) {
      performSearch(type, selectedChunkType);
    }
  };

  const handleChunkTypeChange = (chunkType: ChunkType | "") => {
    setSelectedChunkType(chunkType);
    if (query.trim()) {
      performSearch(searchType, chunkType);
    }
  };

  const clearFilters = () => {
    cancel();
    setSelectedChunkType("");
    if (query.trim()) performSearch(searchType, "");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <input
            aria-label="Search posts"
            type="text"
            value={query}
            onChange={(e) => {
              cancel();
              setQuery(e.target.value);
            }}
            placeholder="search..."
            className="w-full px-4 py-3 bg-paper dark:bg-night border-2 border-rule dark:border-night-raised focus:border-ink dark:focus:border-chalk-soft transition-colors text-ink-strong dark:text-chalk-strong text-lg font-medium placeholder-ink-strong/40 dark:placeholder-chalk-strong/40 outline-hidden selection:bg-ink selection:text-white dark:selection:bg-chalk-soft dark:selection:text-night"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clearQuery}
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
        <div
          role="alert"
          className="text-red-500 dark:text-red-400 mb-4 p-4 border-l-2 border-red-500"
        >
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
        !error &&
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
