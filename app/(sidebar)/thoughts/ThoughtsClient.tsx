"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { fetchThoughtPage } from "@/utils/thoughtsPage";
import { parsePublicUrl } from "@/utils/tweets/link";
import type { Thought } from "@/utils/thoughts";

const PAGE_SIZE = 100;
const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function linkedText(content: string): ReactNode[] {
  return content.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
    const url = parsePublicUrl(part);
    return url ? (
      <a
        key={index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 hover:text-accent wrap-anywhere"
      >
        {part}
      </a>
    ) : (
      part
    );
  });
}

type Page = { query: string; thoughts: Thought[]; hasMore: boolean };
export default function ThoughtsClient({
  initialThoughts,
}: {
  initialThoughts: Thought[];
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState<Page>({
    query: "",
    thoughts: initialThoughts,
    hasMore: initialThoughts.length === PAGE_SIZE,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const pending = useRef<AbortController | null>(null);
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (!trimmedQuery) return;
    const controller = new AbortController();
    pending.current = controller;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const thoughts = await fetchThoughtPage(
          null,
          AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]),
          fetch,
          trimmedQuery
        );
        if (!controller.signal.aborted)
          setPage({
            query: trimmedQuery,
            thoughts,
            hasMore: thoughts.length === PAGE_SIZE,
          });
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
        if (pending.current === controller) pending.current = null;
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery, retry]);
  useEffect(() => () => pending.current?.abort(), []);

  async function loadMore() {
    if (pending.current || !page.hasMore || page.query !== trimmedQuery) return;
    const cursor = page.thoughts.at(-1)?.id;
    if (cursor === undefined) return;
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setError(false);
    try {
      const thoughts = await fetchThoughtPage(
        cursor,
        AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]),
        fetch,
        trimmedQuery
      );
      if (!controller.signal.aborted)
        setPage((previous) => ({
          query: previous.query,
          thoughts: [...previous.thoughts, ...thoughts],
          hasMore: thoughts.length === PAGE_SIZE,
        }));
    } catch {
      if (!controller.signal.aborted) setError(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
      if (pending.current === controller) pending.current = null;
    }
  }

  const current = page.query === trimmedQuery;
  return (
    <section className="py-8 sm:py-12">
      <header className="mb-9 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-3xl text-primary">thoughts</h1>
          <p className="mt-3 text-sm text-muted">
            notes in passing. things worth keeping.
          </p>
        </div>
        <Link
          href="/thoughts/new"
          className="shrink-0 text-xs text-muted underline underline-offset-4 hover:text-accent"
        >
          write a thought
        </Link>
      </header>
      <label htmlFor="thought-search" className="sr-only">
        Search thoughts
      </label>
      <input
        id="thought-search"
        type="search"
        value={query}
        maxLength={200}
        placeholder="search the stream…"
        onChange={(event) => {
          if (event.target.value.trim() !== trimmedQuery) {
            pending.current?.abort();
            pending.current = null;
            setError(false);
            setLoading(false);
          }
          setQuery(event.target.value);
          if (!event.target.value.trim())
            setPage({
              query: "",
              thoughts: initialThoughts,
              hasMore: initialThoughts.length === PAGE_SIZE,
            });
        }}
        className="mb-10 w-full rounded-sm border border-line bg-raised px-4 py-3 text-base text-primary placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
      {!current && !error && (
        <p role="status" className="py-8 text-sm text-muted">
          searching the stream…
        </p>
      )}
      {current && (
        <div className="space-y-10 sm:space-y-12">
          {page.thoughts.map((entry) => {
            const date = new Date(entry.created_at);
            const link = entry.link ? parsePublicUrl(entry.link) : null;
            return (
              <article
                id={`thought-${entry.id}`}
                key={entry.id}
                className="grid gap-3 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-6 scroll-mt-8"
              >
                <time
                  dateTime={date.toISOString()}
                  className="text-xs leading-relaxed text-muted"
                >
                  {formatter.format(date)}
                </time>
                <div className="min-w-0 space-y-3">
                  {entry.content && (
                    <p className="whitespace-pre-wrap wrap-break-word text-base leading-relaxed text-primary">
                      {linkedText(entry.content)}
                    </p>
                  )}
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border-l-2 border-line pl-4 text-sm leading-relaxed text-accent hover:text-primary wrap-anywhere"
                    >
                      <span className="underline underline-offset-4">
                        {entry.link_title ||
                          new URL(link).hostname.replace(/^www\./, "")}
                      </span>
                      {entry.link_title && (
                        <span className="mt-1 block text-xs text-muted">
                          {new URL(link).hostname.replace(/^www\./, "")}
                        </span>
                      )}
                    </a>
                  )}
                </div>
              </article>
            );
          })}
          {page.thoughts.length === 0 && (
            <p role="status" className="py-12 text-sm text-muted">
              {trimmedQuery
                ? "no thoughts match this search."
                : "nothing here yet. a thought can start anywhere."}
            </p>
          )}
        </div>
      )}
      {error && (
        <div role="alert" className="mt-8 text-sm text-primary">
          couldn’t load thoughts.{" "}
          <button
            type="button"
            className="underline underline-offset-4"
            onClick={() => {
              if (!current) setRetry((value) => value + 1);
              else void loadMore();
            }}
          >
            try again
          </button>
        </div>
      )}
      {current && page.hasMore && (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loading}
          className="mt-12 min-h-11 w-full border-t border-line py-4 text-sm text-accent disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-accent"
        >
          {loading ? "loading…" : "older thoughts ↓"}
        </button>
      )}
    </section>
  );
}
