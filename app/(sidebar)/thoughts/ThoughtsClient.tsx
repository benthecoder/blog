"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import type { Thought } from "@/types/thoughts";

const TZ = "America/New_York";
const PAGE_SIZE = 100;

function parseContent(content: string): ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);

  return parts.map((part, index) => {
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-japanese-sumiiro/70 dark:hover:text-japanese-shironezu/70 transition-colors break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

interface ThoughtsClientProps {
  initialThoughts: Thought[];
}

export default function ThoughtsClient({
  initialThoughts,
}: ThoughtsClientProps) {
  const [thoughts, setThoughts] = useState<Thought[]>(initialThoughts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialThoughts.length === PAGE_SIZE);
  const observerRef = useRef<HTMLDivElement>(null);

  const groupedByDate = useMemo(
    () =>
      thoughts.reduce(
        (acc, entry) => {
          const dateStr = new Date(entry.created_at).toLocaleDateString(
            "en-US",
            { timeZone: TZ, year: "2-digit", month: "2-digit", day: "2-digit" }
          );
          (acc[dateStr] ??= []).push(entry);
          return acc;
        },
        {} as Record<string, Thought[]>
      ),
    [thoughts]
  );

  const dates = useMemo(() => Object.keys(groupedByDate), [groupedByDate]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const lastId = thoughts[thoughts.length - 1]?.id;
      const response = await fetch(
        `/api/thoughts?cursor=${lastId}&limit=${PAGE_SIZE}`
      );
      const newThoughts: Thought[] = await response.json();

      if (newThoughts.length > 0) {
        setThoughts((prev) => [...prev, ...newThoughts]);
        setHasMore(newThoughts.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more thoughts:", error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, thoughts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="space-y-8">
        {dates.map((date) => (
          <div key={date} className="relative">
            <div className="mb-2 pb-2 border-b border-japanese-shiraumenezu dark:border-japanese-ginnezu/30">
              <p className="text-xs text-japanese-sumiiro/50 dark:text-japanese-shironezu/50 tracking-wide lowercase text-center">
                {date}
              </p>
            </div>

            <div className="space-y-6">
              {groupedByDate[date].map((entry) => {
                const time = new Date(entry.created_at).toLocaleString(
                  "en-GB",
                  {
                    timeZone: TZ,
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }
                );

                return (
                  <div key={entry.id} className="flex gap-4 items-baseline">
                    <span className="text-xs text-japanese-sumiiro/50 dark:text-japanese-shironezu/50 shrink-0 select-none w-10">
                      {time}
                    </span>
                    <p className="text-sm text-japanese-sumiiro dark:text-japanese-shironezu leading-relaxed break-words whitespace-pre-wrap flex-1">
                      {parseContent(entry.content)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {thoughts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-japanese-sumiiro dark:text-japanese-shironezu">
              empty stream...
            </p>
          </div>
        )}

        {hasMore && (
          <div ref={observerRef} className="py-12 text-center">
            {loading && (
              <p className="text-xs text-japanese-sumiiro dark:text-japanese-shironezu tracking-wide">
                loading more...
              </p>
            )}
          </div>
        )}

        {!hasMore && thoughts.length > 0 && (
          <div className="py-12 text-center">
            <p className="text-xs text-japanese-sumiiro dark:text-japanese-shironezu tracking-wide">
              ~ end of stream ~
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
