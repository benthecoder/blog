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
    if (!query.trim()) clearQuery();
    else performSearch(searchType, selectedChunkType);
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
    <div className="w-full">
      <h1 className="mb-6 text-2xl text-primary">search</h1>
      <form onSubmit={handleSearch} className="mb-5">
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
            className="w-full min-w-0 border-b border-line bg-transparent py-3 pr-9 text-lg text-primary placeholder:text-muted focus:border-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4 transition-colors"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clearQuery}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 transition-colors"
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
          className="mb-4 border-l-2 border-accent pl-4 text-sm text-primary"
        >
          {error}
        </div>
      )}

      {results.length > 0 ? (
        <div>
          <div className="pb-2 border-b border-line">
            <p className="text-xs text-muted">
              {results.length} {results.length === 1 ? "result" : "results"}
            </p>
          </div>
          <div className="min-w-0">
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
          <div className="py-8 border-t border-line">
            <p className="text-muted mb-2">
              No results found for &quot;{query}&quot;
            </p>
            {selectedChunkType && (
              <button
                onClick={clearFilters}
                className="mt-2 text-sm text-accent underline underline-offset-4"
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
        <div className="w-full py-8">
          <Loader text="loading search..." size="md" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
