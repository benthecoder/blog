import Link from "next/link";
import getWikiMetadata from "@/utils/getWikiMetadata";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "wiki",
  description: "Living notes on topics I keep coming back to",
};

const WikiPage = () => {
  const pages = getWikiMetadata();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">
          wiki
        </h1>
        <p className="text-xs text-light-text/50 dark:text-dark-text/50 mt-1">
          {pages.length} {pages.length === 1 ? "topic" : "topics"}
        </p>
      </div>

      {pages.length === 0 ? (
        <p className="text-sm text-light-text/40 dark:text-dark-text/40">
          Nothing here yet.
        </p>
      ) : (
        <div className="divide-y divide-light-border dark:divide-dark-border">
          {pages.map((page) => (
            <Link
              key={page.slug}
              href={`/wiki/${page.slug}`}
              className="group flex items-center justify-between py-3 gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm text-light-text dark:text-dark-text group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors truncate">
                  {page.title}
                </span>
                {page.tags.length > 0 && (
                  <span className="text-[10px] font-mono text-light-text/30 dark:text-dark-text/30 shrink-0">
                    {page.tags.join(", ")}
                  </span>
                )}
              </div>
              {page.lastUpdated && (
                <span className="text-[10px] font-mono text-light-text/30 dark:text-dark-text/30 shrink-0">
                  {page.lastUpdated}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default WikiPage;
