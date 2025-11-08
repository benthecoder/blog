"use client";
import { useEffect, useState } from "react";
import type { CuriusLink } from "@/types/curius";

export default function CuriusPage() {
  const [links, setLinks] = useState<CuriusLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await fetch("/api/curius");
        const data = await response.json();
        setLinks(data.data.links);
      } catch (error) {
        console.error("Failed to fetch Curius links:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinks();
  }, []);

  const formatTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const days = Math.floor(diffInSeconds / (3600 * 24));
    const hours = Math.floor((diffInSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return "now";
  };

  return (
    <div>
      {isLoading ? (
        <p className="text-japanese-sumiiro/50 dark:text-japanese-shironezu/50">
          discombobulating...
        </p>
      ) : (
        <>
          <p className="mb-5">
            stay{" "}
            <a
              href="https://curius.app/benedict-neo"
              className="text-japanese-sumiiro dark:text-japanese-shironezu hover:text-japanese-ginnezu dark:hover:text-japanese-ginnezu transition-colors"
            >
              curius
            </a>
          </p>
          <ol className="space-y-1 list-none">
            {links.map((link, index) => (
              <li key={link.id} className="flex items-baseline gap-2">
                <span className="text-japanese-sumiiro dark:text-japanese-shironezu text-sm tabular-nums min-w-[2ch]">
                  {index + 1}.
                </span>
                <a
                  href={link.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-japanese-sumiiro dark:text-japanese-shironezu hover:text-japanese-ginnezu dark:hover:text-japanese-ginnezu transition-colors"
                >
                  {link.title.toLowerCase()}
                </a>
                <span className="text-japanese-sumiiro/50 dark:text-japanese-shironezu/50 text-sm whitespace-nowrap">
                  {formatTime(link.createdDate)}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
