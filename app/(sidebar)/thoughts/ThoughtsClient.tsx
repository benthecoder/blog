"use client";

import { useState, useEffect, useRef, useEffectEvent } from "react";
import Link from "next/link";
import { fetchThoughtPage } from "@/utils/thoughtsPage";
import type { Thought } from "@/utils/thoughts";
import ThoughtBody from "@/components/thoughts/ThoughtBody";
import {
  parseThoughtHash,
  thoughtAnchorId,
  thoughtDateFormatter,
  thoughtTimeFormatter,
} from "@/utils/thoughtShare";

const PAGE_SIZE = 100;

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
      const dateStr = thoughtDateFormatter.format(new Date(entry.created_at));
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
          // loadMore logs its own failures; the next scroll retries.
          void loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, thoughts.length]);

  // /thoughts#t-<id> jumps to the note when it's on this page; otherwise
  // the shareable /thoughts/<id> page is the right place to land.
  useEffect(() => {
    const reveal = () => {
      const id = parseThoughtHash(window.location.hash);
      if (id == null) return;
      const el = document.getElementById(thoughtAnchorId(id));
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        return;
      }
      window.location.replace(`/thoughts/${id}`);
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="sr-only">thoughts</h1>
      <div className="space-y-8">
        {dates.map((date) => (
          <div key={date} className="relative">
            <div className="mb-2 pb-2 border-b border-rule dark:border-chalk-muted/30">
              <p className="text-xs text-muted tracking-wide lowercase text-center">
                {date}
              </p>
            </div>

            <div className="space-y-6">
              {groupedByDate[date].map((entry) => {
                const time = thoughtTimeFormatter.format(
                  new Date(entry.created_at)
                );

                return (
                  <div
                    key={entry.id}
                    id={thoughtAnchorId(entry.id)}
                    className="thought-entry flex gap-4 items-baseline"
                  >
                    <Link
                      href={`/thoughts/${entry.id}`}
                      className="text-xs text-muted shrink-0 w-10 hover:text-accent transition-colors"
                      title="permalink"
                    >
                      {time}
                    </Link>
                    <ThoughtBody
                      content={entry.content}
                      link={entry.link}
                      titles={entry.titles}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {thoughts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-accent">empty stream...</p>
          </div>
        )}

        {hasMore && (
          <div ref={observerRef} className="py-12 text-center">
            {loading && (
              <p className="text-xs text-accent tracking-wide">
                loading more...
              </p>
            )}
          </div>
        )}

        {!hasMore && thoughts.length > 0 && (
          <div className="py-12 text-center">
            <p className="text-xs text-accent tracking-wide">
              ~ end of stream ~
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
