"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useLatestSearch } from "@/components/hooks/useLatestSearch";
import { loadLocalSearch } from "@/utils/loadLocalSearch";
import type { LocalSearch } from "@/utils/localSearch";
import type { SearchType } from "@/types/search";
import type { ChunkType } from "@/types/chunks";
import {
  extractKeywords,
  getSnippet,
  highlightText,
} from "@/components/search/searchHelpers";
import SearchFilters from "@/components/search/SearchFilters";
import { textFragment } from "@/utils/searchTextFragment";

export default function SearchExplorer({
  onNavigate,
}: {
  onNavigate: () => void;
}) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("keyword");
  const [chunkType, setChunkType] = useState<ChunkType | "">("");
  const [engine, setEngine] = useState<LocalSearch | null>(null);
  const [indexError, setIndexError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [active, setActive] = useState(0);
  const remote = useLatestSearch();
  const { execute, cancel } = remote;
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const id = useId();
  const local = searchType === "keyword" && !chunkType;
  const keywords = extractKeywords(query.replace(/^#/, ""));

  useEffect(() => {
    let disposed = false;
    loadLocalSearch()
      .then((search) => {
        if (!disposed) {
          setEngine(() => search);
          setIndexError(false);
        }
      })
      .catch(() => {
        if (!disposed) setIndexError(true);
      });
    return () => {
      disposed = true;
    };
  }, [retry]);

  useEffect(() => {
    cancel();
    if (local || !query.trim()) return;
    const timer = setTimeout(() => {
      void execute({ query, searchType, chunkType });
    }, 200);
    return () => {
      clearTimeout(timer);
      cancel();
    };
  }, [query, searchType, chunkType, local, execute, cancel]);

  const results = useMemo(() => {
    const found = local ? (engine?.(query) ?? []) : remote.results;
    return found.filter(
      (result, index) =>
        found.findIndex((entry) => entry.post_slug === result.post_slug) ===
        index
    );
  }, [local, engine, query, remote.results]);
  const selected = results[Math.min(active, results.length - 1)];
  const selectedIndex = selected ? results.indexOf(selected) : -1;

  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
    if (previewRef.current) previewRef.current.scrollTop = 0;
  }, [selectedIndex, query]);

  const navigate = (result = selected) => {
    if (!result) return;
    onNavigate?.();
    const fragment = textFragment(result.content, keywords, result.chunk_type);
    const href = `/posts/${encodeURIComponent(result.post_slug)}`;
    // Text fragments require a document navigation to highlight the passage.
    if (fragment) window.location.assign(href + fragment);
    else router.push(href);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onNavigate?.();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive(
        Math.max(
          0,
          Math.min(
            selectedIndex + (event.key === "ArrowDown" ? 1 : -1),
            results.length - 1
          )
        )
      );
    } else if (event.key === "Enter" && selected) {
      event.preventDefault();
      navigate();
    }
  };
  const loading =
    query.trim() && (local ? !engine && !indexError : remote.isLoading);
  const error = local ? indexError : remote.error;

  return (
    <div className="min-w-0 text-primary">
      <div className="flex items-center gap-3 border border-line bg-surface px-4 focus-within:border-accent">
        <input
          ref={inputRef}
          // Focus is intentional for the user-invoked search dialog.
          autoFocus
          maxLength={500}
          type="text"
          inputMode="search"
          role="combobox"
          aria-label="Search posts"
          aria-autocomplete="list"
          aria-expanded={results.length > 0}
          aria-controls={`${id}-results`}
          aria-activedescendant={
            selected ? `${id}-${selectedIndex}` : undefined
          }
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="search anything…"
          className="w-full min-w-0 bg-transparent py-3 text-base md:text-lg outline-hidden placeholder:text-muted"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              cancel();
              setQuery("");
              setActive(0);
              inputRef.current?.focus();
            }}
            className="shrink-0 p-2 text-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4"
            >
              <path d="m6 6 12 12M6 18 18 6" />
            </svg>
          </button>
        )}
        <button
          onClick={onNavigate}
          aria-label="Close search"
          className="text-xs text-muted hover:text-accent p-2"
        >
          esc
        </button>
      </div>
      <div className="flex items-center justify-between gap-3 py-3 text-xs text-muted">
        <span role="status" aria-live="polite">
          {loading
            ? "loading search…"
            : query.trim()
              ? `${results.length === 30 ? "top " : ""}${results.length} ${results.length === 1 ? "result" : "results"}`
              : "search posts, ideas, or #tags"}
        </span>
        <details className="relative">
          <summary className="cursor-pointer hover:text-accent">
            {local ? "search options" : `${searchType} · options`}
          </summary>
          <div className="absolute right-0 top-full z-10 mt-2 w-72 border border-line bg-raised p-4 shadow-lg">
            <SearchFilters
              searchType={searchType}
              selectedChunkType={chunkType}
              onSearchTypeChange={(type) => {
                cancel();
                setSearchType(type);
                setActive(0);
              }}
              onChunkTypeChange={(type) => {
                cancel();
                setChunkType(type);
                setActive(0);
              }}
              onClearFilters={() => setChunkType("")}
            />
          </div>
        </details>
      </div>
      {error ? (
        <div role="alert" className="border border-line p-5 text-sm">
          Search unavailable.{" "}
          <button
            className="text-accent underline"
            onClick={() => {
              if (local) {
                setIndexError(false);
                setRetry((value) => value + 1);
              } else void execute({ query, searchType, chunkType });
            }}
          >
            try again
          </button>
        </div>
      ) : results.length > 0 ? (
        <div className="grid h-[60vh] min-w-0 border border-line bg-surface md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.65fr)]">
          {/* Combobox pattern: focus stays in the input, which points here via
              aria-activedescendant, so the listbox itself is not focusable. */}
          {/* oxlint-disable-next-line jsx-a11y/interactive-supports-focus */}
          <div
            ref={listRef}
            onKeyDown={onKeyDown}
            role="listbox"
            aria-label="Search results"
            id={`${id}-results`}
            className="min-w-0 overflow-y-auto overscroll-contain md:border-r md:border-line"
          >
            {results.map((result, index) => (
              // Each option is named by its button's text content.
              // oxlint-disable-next-line jsx-a11y/control-has-associated-label
              <div
                key={result.post_slug}
                id={`${id}-${index}`}
                role="option"
                aria-selected={selectedIndex === index}
                className={`border-b border-line last:border-b-0 ${selectedIndex === index ? "bg-accent/10" : ""}`}
              >
                <button
                  className="block w-full p-4 text-left focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
                  onFocus={() => setActive(index)}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => navigate(result)}
                >
                  <h2 className="text-base font-bold leading-snug break-words">
                    {highlightText(result.post_title, keywords)}
                  </h2>
                  <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-2">
                    {highlightText(
                      getSnippet(result.content, keywords, 120),
                      keywords
                    )}
                  </p>
                </button>
              </div>
            ))}
          </div>
          {selected && (
            <article
              ref={previewRef}
              aria-label="Post preview"
              className="hidden min-w-0 overflow-y-auto overscroll-contain p-6 md:block lg:p-8"
            >
              <h2 className="text-3xl font-bold leading-tight break-words">
                {highlightText(selected.post_title, keywords)}
              </h2>
              {selected.published_date && (
                <p className="mt-2 text-xs text-muted">
                  {new Date(selected.published_date).toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    }
                  )}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-accent">
                {selected.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
              <div className="mt-6 whitespace-pre-wrap break-words text-sm leading-relaxed">
                {highlightText(
                  getSnippet(selected.content, keywords, 5000),
                  keywords
                )}
              </div>
              <button
                onClick={() => navigate()}
                className="mt-6 text-sm text-accent hover:underline"
              >
                read post →
              </button>
            </article>
          )}
        </div>
      ) : !loading && query.trim() ? (
        <p className="border border-line p-6 text-sm text-muted">
          no posts found for “{query}”
        </p>
      ) : null}
      <p className="mt-3 text-[10px] text-muted">
        ↑↓ navigate · enter to open · esc to close
      </p>
    </div>
  );
}
