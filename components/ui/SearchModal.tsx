"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type SearchType = "keyword" | "semantic";

interface SearchResult {
  post_slug: string;
  post_title: string;
  published_date?: string;
  content?: string;
}

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("keyword");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Open on cmd+K / ctrl+K, or custom "openSearch" event (from sidebar button)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    document.addEventListener("openSearch", onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("openSearch", onOpen);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }, [open]);

  const search = useCallback(async (q: string, type: SearchType) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, searchType: type }),
      });
      const data = await res.json();
      // Deduplicate by slug
      const seen = new Set<string>();
      const deduped: SearchResult[] = [];
      for (const r of data.results ?? []) {
        if (!seen.has(r.post_slug)) {
          seen.add(r.post_slug);
          deduped.push(r);
        }
      }
      setResults(deduped.slice(0, 8));
      setActiveIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search on input change
  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(value, searchType);
    }, 300);
  };

  const handleTypeToggle = (type: SearchType) => {
    setSearchType(type);
    if (query.trim()) search(query, type);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      navigate(results[activeIndex].post_slug);
    }
  };

  const navigate = (slug: string) => {
    setOpen(false);
    router.push(`/posts/${slug}`);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-japanese-kinairo/80 dark:bg-[#111]/80 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg mx-4 bg-japanese-kinairo dark:bg-[#1c1c1c] border border-japanese-shiraumenezu dark:border-white/[0.08] shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center border-b border-japanese-shiraumenezu dark:border-white/[0.06] px-3 gap-2">
          <svg
            className="w-4 h-4 text-japanese-sumiiro/30 dark:text-japanese-shironezu/30 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="search posts…"
            className="flex-1 py-3 text-sm bg-transparent outline-none text-japanese-sumiiro dark:text-japanese-shironezu placeholder:text-japanese-sumiiro/30 dark:placeholder:text-japanese-shironezu/30"
          />
          {/* Type toggle */}
          <div className="flex items-center gap-1 shrink-0">
            {(["keyword", "semantic"] as SearchType[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTypeToggle(t)}
                className={`text-[10px] px-1.5 py-0.5 tracking-wide transition-[color,border-color] duration-150 border ${
                  searchType === t
                    ? "border-japanese-sumiiro/50 dark:border-japanese-shironezu/50 text-japanese-sumiiro dark:text-japanese-shironezu"
                    : "border-transparent text-japanese-sumiiro/30 dark:text-japanese-shironezu/30 hover:text-japanese-sumiiro/60 dark:hover:text-japanese-shironezu/60"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="px-4 py-3 text-xs text-japanese-sumiiro/40 dark:text-japanese-shironezu/40">
            searching…
          </div>
        )}

        {!loading && query.trim() && results.length === 0 && (
          <div className="px-4 py-3 text-xs text-japanese-sumiiro/40 dark:text-japanese-shironezu/40">
            no results
          </div>
        )}

        {!loading && results.length > 0 && (
          <ul>
            {results.map((r, i) => (
              <li key={r.post_slug}>
                <button
                  onClick={() => navigate(r.post_slug)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full text-left px-4 py-2.5 transition-[background-color] duration-100 ${
                    i === activeIndex
                      ? "bg-japanese-sumiiro/5 dark:bg-japanese-shironezu/5"
                      : ""
                  }`}
                >
                  <div className="text-sm text-japanese-sumiiro dark:text-japanese-shironezu truncate">
                    {r.post_title}
                  </div>
                  {r.published_date && (
                    <div className="text-[10px] text-japanese-sumiiro/35 dark:text-japanese-shironezu/35 mt-0.5 tabular-nums">
                      {new Date(r.published_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Footer hint */}
        {results.length > 0 && (
          <div className="border-t border-japanese-shiraumenezu dark:border-white/[0.06] px-4 py-2 flex gap-3 text-[10px] text-japanese-sumiiro/30 dark:text-japanese-shironezu/30">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
          </div>
        )}
      </div>
    </div>
  );
}
