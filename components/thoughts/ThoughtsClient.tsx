"use client";

import { useState, useEffect, useRef } from "react";

interface Tweet {
  id: number;
  content: string;
  created_at: Date;
}

interface ThoughtsClientProps {
  initialThoughts: Tweet[];
  total: number;
}

export default function ThoughtsClient({
  initialThoughts,
  total,
}: ThoughtsClientProps) {
  const [thoughts, setThoughts] = useState<Tweet[]>(initialThoughts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialThoughts.length < total);
  const observerRef = useRef<HTMLDivElement>(null);

  const groupedByDate = thoughts.reduce(
    (acc, entry) => {
      const dateObj = new Date(entry.created_at);
      const dateStr = dateObj.toLocaleDateString("en-US", {
        timeZone: "America/Chicago",
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      });

      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(entry);
      return acc;
    },
    {} as Record<string, Tweet[]>
  );

  const dates = Object.keys(groupedByDate);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/thoughts?offset=${thoughts.length}&limit=100`
      );
      const newThoughts: Tweet[] = await response.json();

      if (newThoughts.length > 0) {
        setThoughts((prev) => [...prev, ...newThoughts]);
        setHasMore(thoughts.length + newThoughts.length < total);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more thoughts:", error);
    } finally {
      setLoading(false);
    }
  };

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
  }, [hasMore, loading, thoughts.length]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="space-y-8">
        {dates.map((date) => (
          <div key={date} className="relative">
            <div className="mb-6 pb-2 border-b border-japanese-shiraumenezu dark:border-japanese-ginnezu/30">
              <p className="text-xs text-japanese-sumiiro/50 dark:text-japanese-shironezu/50 tracking-wide lowercase">
                {date}
              </p>
            </div>

            <div className="space-y-6">
              {groupedByDate[date].map((entry) => {
                const time = new Date(entry.created_at).toLocaleString(
                  "en-GB",
                  {
                    timeZone: "America/Chicago",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }
                );

                return (
                  <div key={entry.id} className="flex gap-4">
                    <span className="text-xs text-japanese-sumiiro/50 dark:text-japanese-shironezu/50 shrink-0 select-none leading-relaxed">
                      {time}
                    </span>
                    <p className="text-sm text-japanese-sumiiro dark:text-japanese-shironezu leading-relaxed break-words whitespace-pre-wrap">
                      {entry.content}
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
