import Link from "next/link";
import type { Metadata } from "next";
import { getEssayMetadata } from "@/utils/content/essays";
import { formatEssayDate } from "@/utils/content/essayDate";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "essays",
  description: "Long-form essays",
  alternates: {
    canonical: "/essays",
    types: { "application/rss+xml": "/essays/rss.xml" },
  },
};

const EssaysPage = () => {
  const essays = getEssayMetadata();

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-10 text-2xl font-bold lowercase text-ink-strong dark:text-chalk-strong">
        essays
      </h1>
      {essays.length === 0 ? (
        <p className="text-sm text-ink-strong/40 dark:text-chalk-strong/40">
          Nothing here yet.
        </p>
      ) : (
        <ul className="space-y-8">
          {essays.map((essay) => (
            <li key={essay.slug}>
              <Link href={`/essays/${essay.slug}`} className="group block">
                <h2 className="text-lg font-bold lowercase text-ink-strong transition-colors group-hover:text-ink dark:text-chalk-strong dark:group-hover:text-chalk-soft">
                  {essay.title}
                </h2>
                {essay.subtitle && (
                  <p className="mt-0.5 text-sm text-ink-soft dark:text-chalk-soft">
                    {essay.subtitle}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-ink-soft/80 dark:text-chalk-muted">
                  {formatEssayDate(essay.date)} · {essay.readingTime} min read
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EssaysPage;
