"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Loader from "@/components/Loader";

interface SearchResult {
  content: string;
  post_slug: string;
  post_title: string;
  chunk_type: string;
  tags: string[];
  published_date?: string;
  similarity: number;
  vector_similarity?: number;
  keyword_score?: number;
  score_type: "keyword" | "semantic" | "hybrid";
  section?: string;
  language?: string;
}

const LoadingComponent = () => {
  return (
    <div className="py-8">
      <Loader text="scavenging the archives..." size="md" />
    </div>
  );
};

const SearchResult = ({
  result,
  query,
}: {
  result: SearchResult;
  query?: string;
}) => {
  // Extract keywords from query for highlighting
  const getKeywords = (searchQuery: string): string[] => {
    if (!searchQuery) return [];
    return searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0); // Include all words
  };

  // Find the best snippet with keyword context
  const getBestSnippet = (
    text: string,
    keywords: string[],
    maxLength: number = 200
  ): { snippet: string; hasMatch: boolean } => {
    if (keywords.length === 0 || result.chunk_type === "code") {
      return {
        snippet:
          text.length > maxLength ? text.substring(0, maxLength) + "..." : text,
        hasMatch: false,
      };
    }

    const lowerText = text.toLowerCase();
    let bestIndex = -1;
    let matchedKeyword = "";

    // Find first keyword match
    for (const keyword of keywords) {
      const index = lowerText.indexOf(keyword);
      if (index !== -1) {
        bestIndex = index;
        matchedKeyword = keyword;
        break;
      }
    }

    if (bestIndex === -1) {
      // No match found, just truncate
      return {
        snippet:
          text.length > maxLength ? text.substring(0, maxLength) + "..." : text,
        hasMatch: false,
      };
    }

    // Extract context around the match
    const contextBefore = 60;
    const contextAfter = maxLength - contextBefore - matchedKeyword.length;
    const start = Math.max(0, bestIndex - contextBefore);
    const end = Math.min(
      text.length,
      bestIndex + matchedKeyword.length + contextAfter
    );

    let snippet = text.substring(start, end);
    if (start > 0) snippet = "..." + snippet;
    if (end < text.length) snippet = snippet + "...";

    return { snippet, hasMatch: true };
  };

  // Highlight keywords in text
  const highlightText = (text: string, keywords: string[]): React.ReactNode => {
    if (keywords.length === 0) return text;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const lowerText = text.toLowerCase();

    // Find all keyword positions
    const matches: { index: number; length: number; keyword: string }[] = [];
    keywords.forEach((keyword) => {
      let index = 0;
      while ((index = lowerText.indexOf(keyword, index)) !== -1) {
        matches.push({ index, length: keyword.length, keyword });
        index += keyword.length;
      }
    });

    // Sort by position
    matches.sort((a, b) => a.index - b.index);

    // Build highlighted text
    matches.forEach(({ index, length }) => {
      if (index > lastIndex) {
        parts.push(text.substring(lastIndex, index));
      }
      parts.push(
        <mark
          key={index}
          className="bg-light-accent dark:bg-dark-accent text-white font-medium px-1 py-0.5 rounded"
        >
          {text.substring(index, index + length)}
        </mark>
      );
      lastIndex = index + length;
    });

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return <>{parts}</>;
  };

  const formatContent = (content: string) => {
    if (!query) {
      // No query to highlight
      const truncated =
        content.length > 200 ? content.substring(0, 200) + "..." : content;
      return (
        <p className="text-light-text/70 dark:text-dark-text/70 mt-2 text-sm leading-relaxed">
          {truncated}
        </p>
      );
    }

    const keywords = getKeywords(query);
    const { snippet, hasMatch } = getBestSnippet(content, keywords);

    if (result.chunk_type === "code") {
      return (
        <pre className="bg-light-tag dark:bg-dark-tag p-2 rounded text-sm overflow-x-auto mt-2">
          <code>{snippet}</code>
        </pre>
      );
    }

    return (
      <p className="text-light-text/70 dark:text-dark-text/70 mt-2 text-sm leading-relaxed">
        {highlightText(snippet, keywords)}
      </p>
    );
  };

  return (
    <div className="group border-l-2 border-light-border dark:border-dark-tag pl-4 py-3 mb-4 hover:border-light-accent dark:hover:border-dark-accent transition-colors hover:bg-light-tag/50 dark:hover:bg-dark-tag/50 rounded-r">
      <Link href={`/posts/${result.post_slug}`} className="block space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium text-light-text dark:text-dark-text group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors">
            {result.post_title}
          </h3>
          <span className="text-xs px-2 py-1 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 text-light-accent dark:text-dark-accent font-medium whitespace-nowrap">
            {Math.round(result.similarity * 100)}% match
          </span>
        </div>
        <div className="prose prose-sm max-w-none">
          {formatContent(result.content)}
        </div>
        <div className="flex items-center gap-2 text-xs text-light-accent/70 dark:text-dark-accent/70">
          <span className="capitalize font-medium">{result.chunk_type}</span>
          {result.section && (
            <>
              <span>•</span>
              <span className="text-light-text/60 dark:text-dark-text/60 italic">
                {result.section}
              </span>
            </>
          )}
          {result.language && (
            <>
              <span>•</span>
              <span className="text-light-text/60 dark:text-dark-text/60 font-mono text-[10px]">
                {result.language}
              </span>
            </>
          )}
          {result.tags && result.tags.length > 0 && (
            <>
              <span>•</span>
              <div className="flex gap-1.5">
                {result.tags.slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="text-light-text/60 dark:text-dark-text/60"
                  >
                    #{tag}
                  </span>
                ))}
                {result.tags.length > 3 && (
                  <span className="text-light-text/50 dark:text-dark-text/50">
                    +{result.tags.length - 3}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </Link>
    </div>
  );
};

function SearchContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Filter states
  const [searchType, setSearchType] = useState<
    "hybrid" | "semantic" | "keyword"
  >("hybrid");
  const [selectedChunkType, setSelectedChunkType] = useState<string>("");
  const [availableChunkTypes, setAvailableChunkTypes] = useState<string[]>([]);

  // Load available filters from API
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch("/api/search-filters");
        const data = await response.json();
        if (data.chunkTypes) setAvailableChunkTypes(data.chunkTypes);
      } catch (error) {
        console.error("Failed to load filters:", error);
      }
    };
    fetchFilters();
  }, []);

  // Load from URL and session storage
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    const urlChunkType = searchParams.get("chunkType");

    setQuery(urlQuery || sessionStorage.getItem("lastQuery") || "");

    if (urlChunkType) {
      setSelectedChunkType(urlChunkType);
    }

    const cached = sessionStorage.getItem("searchResults");
    if (cached) setResults(JSON.parse(cached));

    setHasSearched(sessionStorage.getItem("hasSearched") === "true");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
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
          searchType: searchType,
          chunkType: selectedChunkType || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Search failed: ${data.error || response.statusText}`);
      }

      if (!data.results || !Array.isArray(data.results)) {
        console.warn("Unexpected response format:", data);
        setResults([]);
        return;
      }

      setResults(data.results);
      sessionStorage.setItem("searchResults", JSON.stringify(data.results));
      // Mark that a search has been performed
      setHasSearched(true);
      sessionStorage.setItem("hasSearched", "true");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Search failed";
      setError(errorMessage);
      // Still mark that a search was attempted even if it failed
      setHasSearched(true);
      sessionStorage.setItem("hasSearched", "true");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedChunkType("");
    setResults([]);
    setHasSearched(false);
  };

  // Auto-search when filters change (after a brief delay)
  useEffect(() => {
    if (query.trim()) {
      const timeout = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchType, selectedChunkType]);

  // Format chunk type labels
  const formatChunkTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "full-post": "posts",
      section: "sections",
      code: "code",
      quote: "quotes",
    };
    return labels[type] || type;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Main search form */}
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

      {/* Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Type Filter */}
        <div className="border-t border-light-border dark:border-dark-tag pt-4">
          <label className="block text-xs font-medium text-light-text/70 dark:text-dark-text/70 mb-2 tracking-wide">
            SEARCH TYPE
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSearchType("hybrid")}
              className={`px-3 py-1.5 text-sm border transition-all ${
                searchType === "hybrid"
                  ? "border-light-accent dark:border-dark-accent bg-light-accent/10 dark:bg-dark-accent/10 text-light-accent dark:text-dark-accent"
                  : "border-light-border dark:border-dark-tag text-light-text/60 dark:text-dark-text/60 hover:border-light-accent/50 dark:hover:border-dark-accent/50"
              }`}
            >
              hybrid
            </button>
            <button
              type="button"
              onClick={() => setSearchType("semantic")}
              className={`px-3 py-1.5 text-sm border transition-all ${
                searchType === "semantic"
                  ? "border-light-accent dark:border-dark-accent bg-light-accent/10 dark:bg-dark-accent/10 text-light-accent dark:text-dark-accent"
                  : "border-light-border dark:border-dark-tag text-light-text/60 dark:text-dark-text/60 hover:border-light-accent/50 dark:hover:border-dark-accent/50"
              }`}
            >
              semantic
            </button>
            <button
              type="button"
              onClick={() => setSearchType("keyword")}
              className={`px-3 py-1.5 text-sm border transition-all ${
                searchType === "keyword"
                  ? "border-light-accent dark:border-dark-accent bg-light-accent/10 dark:bg-dark-accent/10 text-light-accent dark:text-dark-accent"
                  : "border-light-border dark:border-dark-tag text-light-text/60 dark:text-dark-text/60 hover:border-light-accent/50 dark:hover:border-dark-accent/50"
              }`}
            >
              keyword
            </button>
          </div>
        </div>

        {/* Content Type Filter */}
        {availableChunkTypes.length > 0 && (
          <div className="pt-4">
            <label className="block text-xs font-medium text-light-text/70 dark:text-dark-text/70 mb-2 tracking-wide">
              CONTENT TYPE
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedChunkType("")}
                className={`px-3 py-1.5 text-sm border transition-all ${
                  selectedChunkType === ""
                    ? "border-light-accent dark:border-dark-accent bg-light-accent/10 dark:bg-dark-accent/10 text-light-accent dark:text-dark-accent"
                    : "border-light-border dark:border-dark-tag text-light-text/60 dark:text-dark-text/60 hover:border-light-accent/50 dark:hover:border-dark-accent/50"
                }`}
              >
                all
              </button>
              {availableChunkTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedChunkType(type)}
                  className={`px-3 py-1.5 text-sm border transition-all ${
                    selectedChunkType === type
                      ? "border-light-accent dark:border-dark-accent bg-light-accent/10 dark:bg-dark-accent/10 text-light-accent dark:text-dark-accent"
                      : "border-light-border dark:border-dark-tag text-light-text/60 dark:text-dark-text/60 hover:border-light-accent/50 dark:hover:border-dark-accent/50"
                  }`}
                >
                  {formatChunkTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clear filters button */}
        {selectedChunkType && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-light-text/50 dark:text-dark-text/50 hover:text-light-accent dark:hover:text-dark-accent transition-colors"
            >
              clear filters
            </button>
          </div>
        )}
      </div>

      {isLoading && <LoadingComponent />}
      {error && (
        <div className="text-red-500 dark:text-red-400 mb-4 p-4 border-l-2 border-red-500">
          {error}
        </div>
      )}

      {results.length > 0 ? (
        <div>
          {/* Results count */}
          <div className="mb-4 pb-2 border-b border-light-border dark:border-dark-tag">
            <p className="text-xs text-light-text/60 dark:text-dark-text/60 tracking-wide">
              {results.length} RESULTS
            </p>
          </div>
          <div className="space-y-4">
            {results.map((result, index) => (
              <SearchResult key={index} result={result} query={query} />
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
