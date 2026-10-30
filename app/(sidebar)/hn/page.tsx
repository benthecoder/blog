"use client";
import { useState } from "react";
import useSWR from "swr";
import {
  fetchHackerNewsPage,
  HN_POSTS_PER_PAGE as POSTS_PER_PAGE,
  HN_MAX_PAGES as MAX_PAGES,
} from "@/utils/hackerNews";

export default function HackerNewsPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const {
    data: topStories = [],
    isLoading,
    error: isError,
  } = useSWR(
    ["hacker-news", currentPage],
    ([, page]) => fetchHackerNewsPage(page),
    {
      dedupingInterval: 60_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  const handleNextPage = () => {
    if (currentPage < MAX_PAGES - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleBackPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className="w-full">
      <h1 className="sr-only">hn</h1>
      {isLoading ? (
        <p className="text-accent/50">flibbertigibbeting...</p>
      ) : isError ? (
        <p className="text-accent/50">couldn&apos;t reach hacker news</p>
      ) : (
        <div>
          <ol className="space-y-1 list-none">
            {topStories.map((story, index) => (
              <li key={story.id} className="flex items-baseline gap-2">
                <span className="text-accent/30 text-sm tabular-nums min-w-[2ch]">
                  {currentPage * POSTS_PER_PAGE + index + 1}.
                </span>
                <a
                  href={story.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-ink-soft dark:hover:text-chalk-muted transition-colors"
                >
                  {story.title.toLowerCase()}
                </a>
                {story.descendants !== undefined && story.descendants > 0 && (
                  <a
                    href={`https://news.ycombinator.com/item?id=${story.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent/30 hover:text-ink-soft dark:hover:text-chalk-muted transition-colors text-sm whitespace-nowrap"
                  >
                    ({story.descendants})
                  </a>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="mt-8 flex gap-4 text-sm">
        {currentPage > 0 && (
          <button
            onClick={handleBackPage}
            className="text-accent hover:text-ink-soft dark:hover:text-chalk-muted transition-colors"
          >
            back
          </button>
        )}
        {currentPage < MAX_PAGES - 1 && (
          <button
            onClick={handleNextPage}
            className="text-accent hover:text-ink-soft dark:hover:text-chalk-muted transition-colors"
          >
            next
          </button>
        )}
      </div>
    </div>
  );
}
