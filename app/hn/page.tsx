"use client";
import { useEffect, useState } from "react";
import type { HNStory } from "@/types/hackernews";

const POSTS_PER_PAGE = 50;
const MAX_PAGES = 10;

export default function HackerNewsPage() {
  const [topStories, setTopStories] = useState<HNStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const fetchTopStories = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          "https://hacker-news.firebaseio.com/v0/topstories.json"
        );
        const storyIds: number[] = await response.json();

        const startIndex = currentPage * POSTS_PER_PAGE;
        const endIndex = startIndex + POSTS_PER_PAGE;
        const currentStoryIds = storyIds.slice(startIndex, endIndex);

        const stories = await Promise.all(
          currentStoryIds.map(async (id) => {
            const storyResponse = await fetch(
              `https://hacker-news.firebaseio.com/v0/item/${id}.json`
            );
            const story: HNStory = await storyResponse.json();

            if (!story.url) {
              story.url = `https://news.ycombinator.com/item?id=${story.id}`;
            }

            return story;
          })
        );

        setTopStories(stories);
      } catch (error) {
        console.error("Failed to fetch HackerNews stories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopStories();
  }, [currentPage]);

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
      {isLoading ? (
        <p>flibbertigibbeting...</p>
      ) : (
        <div>
          <ol className="space-y-1 list-none">
            {topStories.map((story, index) => (
              <li key={story.id} className="flex items-baseline gap-2">
                <span className="text-japanese-sumiiro/30 dark:text-japanese-shironezu/30 text-sm tabular-nums min-w-[2ch]">
                  {currentPage * POSTS_PER_PAGE + index + 1}.
                </span>
                <a
                  href={story.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-japanese-sumiiro dark:text-japanese-shironezu hover:text-japanese-ginnezu dark:hover:text-japanese-ginnezu transition-colors"
                >
                  {story.title.toLowerCase()}
                </a>
                {story.descendants !== undefined && story.descendants > 0 && (
                  <a
                    href={`https://news.ycombinator.com/item?id=${story.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-japanese-sumiiro/30 dark:text-japanese-shironezu/30 hover:text-japanese-ginnezu dark:hover:text-japanese-ginnezu transition-colors text-sm whitespace-nowrap"
                  >
                    ({story.descendants})
                  </a>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-8 flex gap-4 text-sm">
            {currentPage > 0 && (
              <button
                onClick={handleBackPage}
                className="text-japanese-sumiiro dark:text-japanese-shironezu hover:text-japanese-ginnezu dark:hover:text-japanese-ginnezu transition-colors"
              >
                back
              </button>
            )}
            {currentPage < MAX_PAGES - 1 && (
              <button
                onClick={handleNextPage}
                className="text-japanese-sumiiro dark:text-japanese-shironezu hover:text-japanese-ginnezu dark:hover:text-japanese-ginnezu transition-colors"
              >
                next
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
