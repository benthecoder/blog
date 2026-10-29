"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { textFragment } from "@/utils/searchTextFragment";
import { extractKeywords } from "@/app/(sidebar)/search/searchHelpers";
import { useLatestSearch } from "@/components/hooks/useLatestSearch";

type SearchType = "keyword" | "semantic";

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("keyword");
  const {
    results: chunks,
    error,
    isLoading: loading,
    hasSearched,
    execute,
    cancel,
  } = useLatestSearch();
  const results = chunks
    .filter(
      (r, i) =>
        chunks.findIndex((entry) => entry.post_slug === r.post_slug) === i
    )
    .slice(0, 8);
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const openRef = useRef(false);

  // Open on cmd+K / ctrl+K, or custom "openSearch" event (from sidebar button).
  // State resets happen when opening, so a fresh modal is shown each time.
  useEffect(() => {
    const openFresh = () => {
      setQuery("");
      cancel();
      setActiveIndex(0);
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (openRef.current) {
          setOpen(false);
        } else {
          openFresh();
        }
      }
    };
    const onOpen = () => openFresh();
    document.addEventListener("keydown", onKey);
    document.addEventListener("openSearch", onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("openSearch", onOpen);
    };
  }, [cancel]);

  useEffect(() => {
    openRef.current = open;
    if (!open) return;

    const dialog = dialogRef.current;
    dialog?.showModal();
    inputRef.current?.focus();

    const { overflow, paddingRight } = document.body.style;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    const padding = parseFloat(getComputedStyle(document.body).paddingRight);
    document.body.style.overflow = "hidden";
    if (gutter > 0) document.body.style.paddingRight = `${padding + gutter}px`;
    if (dialog) dialog.style.paddingRight = `${gutter}px`;

    return () => {
      dialog?.close();
      if (dialog) dialog.style.paddingRight = "";
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [open]);

  useEffect(() => {
    cancel();
    if (!open || !query.trim()) return;
    const timer = setTimeout(() => {
      void execute({ query, searchType });
    }, 300);
    return () => {
      clearTimeout(timer);
      cancel();
    };
  }, [open, query, searchType, execute, cancel]);

  const handleInput = (value: string) => {
    cancel();
    setQuery(value);
    setActiveIndex(0);
  };

  const handleTypeToggle = (type: SearchType) => {
    cancel();
    setSearchType(type);
    setActiveIndex(0);
  };

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, Math.min(i + 1, results.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      navigate(results[activeIndex]);
    }
  };

  const navigate = (r: (typeof results)[number]) => {
    setOpen(false);
    const href = `/posts/${r.post_slug}`;
    const fragment = textFragment(
      r.content,
      extractKeywords(query),
      r.chunk_type
    );
    // Text fragments only apply on full document loads, not router.push.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (fragment) window.location.assign(href + fragment);
    else router.push(href);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label="Search posts"
      className="fixed inset-0 z-100 m-0 h-full max-h-none w-full max-w-none hidden open:flex items-start justify-center border-0 bg-transparent p-0 pt-[15vh] text-inherit backdrop:bg-transparent"
      onCancel={(event) => {
        event.preventDefault();
        setOpen(false);
      }}
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-xs" />

      <div
        className="relative w-full max-w-lg mx-4 bg-paper dark:bg-night-raised border border-rule dark:border-white/8 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-rule dark:border-white/6 px-3 gap-2">
          <svg
            className="w-4 h-4 text-accent/30 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            aria-label="Search posts"
            ref={inputRef}
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="search posts…"
            className="flex-1 py-3 text-sm bg-transparent outline-hidden text-accent placeholder:text-accent/30"
          />
          <div className="flex items-center gap-1 shrink-0">
            {(["keyword", "semantic"] as SearchType[]).map((t) => (
              <button
                aria-pressed={searchType === t}
                key={t}
                onClick={() => handleTypeToggle(t)}
                className={`text-[10px] px-1.5 py-0.5 tracking-wide transition-[color,border-color] duration-150 border ${
                  searchType === t
                    ? "border-accent/50 text-accent"
                    : "border-transparent text-accent/30 hover:text-accent/60"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="px-4 py-3 text-xs text-accent/40">searching…</div>
        )}

        {error && (
          <p role="alert" className="px-4 py-3 text-xs text-accent">
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          hasSearched &&
          query.trim() &&
          results.length === 0 && (
            <div className="px-4 py-3 text-xs text-accent/40">no results</div>
          )}

        {!loading && results.length > 0 && (
          <ul>
            {results.map((r, i) => (
              <li key={r.post_slug}>
                <button
                  onClick={() => navigate(r)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full text-left px-4 py-2.5 transition-[background-color] duration-100 ${
                    i === activeIndex ? "bg-accent/5" : ""
                  }`}
                >
                  <div className="text-sm text-accent truncate">
                    {r.post_title}
                  </div>
                  {r.published_date && (
                    <div className="text-[10px] text-accent/35 mt-0.5 tabular-nums">
                      {new Date(r.published_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {results.length > 0 && (
          <div className="border-t border-rule dark:border-white/6 px-4 py-2 flex gap-3 text-[10px] text-accent/30">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
          </div>
        )}
      </div>
    </dialog>
  );
}
