"use client";

import { useState, useEffect, useRef, useEffectEvent } from "react";
import type { ReactNode } from "react";
import { fetchThoughtPage } from "@/utils/thoughtsPage";
import type { Thought } from "@/types/thoughts";

const TZ = "America/New_York";
const PAGE_SIZE = 100;
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
});
const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

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
          className="underline underline-offset-2 hover:text-ink/70 dark:hover:text-chalk/70 transition-colors break-all"
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
  const pendingRequest = useRef<AbortController | null>(null);

  const groupedByDate = thoughts.reduce(
    (acc, entry) => {
      const dateStr = dateFormatter.format(new Date(entry.created_at));
      (acc[dateStr] ??= []).push(entry);
      return acc;
    },
    {} as Record<string, Thought[]>
  );

  const dates = Object.keys(groupedByDate);

  // Read current pagination state without reconnecting the observer whenever
  // loading toggles. Failed pages can retry after leaving/re-entering view.
  const loadMore = useEffectEvent(async () => {
    if (pendingRequest.current || !hasMore) return;
    const controller = new AbortController();
    pendingRequest.current = controller;
    const timeout = setTimeout(() => controller.abort(), 10_000);

    setLoading(true);
    try {
      const lastId = thoughts[thoughts.length - 1]?.id;
      if (lastId === undefined) return;
      const newThoughts = await fetchThoughtPage(lastId, controller.signal);
      if (controller.signal.aborted) return;

      if (newThoughts.length > 0) {
        setThoughts((prev) => [...prev, ...newThoughts]);
        setHasMore(newThoughts.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("Error loading more thoughts:", error);
      }
    } finally {
      clearTimeout(timeout);
      pendingRequest.current = null;
      setLoading(false);
    }
  });

  useEffect(() => () => pendingRequest.current?.abort(), []);

  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, thoughts.length]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="space-y-8">
        {dates.map((date) => (
          <div key={date} className="relative">
            <div className="mb-2 pb-2 border-b border-rule dark:border-chalk-muted/30">
              <p className="text-xs text-ink/50 dark:text-chalk/50 tracking-wide lowercase text-center">
                {date}
              </p>
            </div>

            <div className="space-y-6">
              {groupedByDate[date].map((entry) => {
                const time = timeFormatter.format(new Date(entry.created_at));

                return (
                  <div key={entry.id} className="flex gap-4 items-baseline">
                    <span className="text-xs text-ink/50 dark:text-chalk/50 shrink-0 select-none w-10">
                      {time}
                    </span>
                    <p className="text-sm text-ink dark:text-chalk leading-relaxed wrap-break-word whitespace-pre-wrap flex-1">
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
            <p className="text-sm text-ink dark:text-chalk">empty stream...</p>
          </div>
        )}

        {hasMore && (
          <div ref={observerRef} className="py-12 text-center">
            {loading && (
              <p className="text-xs text-ink dark:text-chalk tracking-wide">
                loading more...
              </p>
            )}
          </div>
        )}

        {!hasMore && thoughts.length > 0 && (
          <div className="py-12 text-center">
            <p className="text-xs text-ink dark:text-chalk tracking-wide">
              ~ end of stream ~
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
