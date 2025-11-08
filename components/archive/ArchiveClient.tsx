"use client";

import { useSearchParams } from "next/navigation";
import { PostMetadata } from "@/types/post";
import PostPreview from "@/components/posts/PostPreview";
import Heatmap from "@/components/visualizations/Heatmap";
import Link from "next/link";

interface ArchiveClientProps {
  allPosts: PostMetadata[];
}

export default function ArchiveClient({ allPosts }: ArchiveClientProps) {
  const searchParams = useSearchParams();
  const currentYear = new Date().getFullYear();

  // Read year from URL params, fallback to current year
  const yearParam = searchParams.get("year");
  const selectedYear = yearParam ? parseInt(yearParam, 10) : currentYear;

  // Filter posts by selected year
  const filteredPosts = allPosts.filter(
    (post) => new Date(post.date).getFullYear() === selectedYear
  );

  // Calculate overall totals (all posts)
  let totalWordCount = 0;
  const totalPosts = allPosts.length;
  allPosts.forEach((post) => {
    totalWordCount += post.wordcount;
  });

  const postPreviews = filteredPosts.map((post) => {
    return <PostPreview key={post.slug} {...post} />;
  });

  return (
    <div>
      <div className="mb-8 pb-4 border-b border-light-border dark:border-dark-tag">
        <p className="text-xs text-light-text/60 dark:text-dark-text/60 tracking-wide mb-2">
          ARCHIVE
        </p>
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold text-light-accent dark:text-dark-accent">
            {totalPosts} entries
          </h1>
          <span className="text-sm text-light-text/40 dark:text-dark-text/40 font-mono tabular-nums">
            {new Intl.NumberFormat().format(totalWordCount)} words
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 text-sm">
        <div className="flex flex-row space-x-2 mb-6">
          <div>
            filter by{" "}
            <Link
              href="/tags"
              className="underline hover:text-light-accent dark:hover:text-dark-accent transition-colors"
            >
              tags
            </Link>
          </div>
          <div className="text-black-400">•</div>
          <div>
            <Link
              href="/search"
              className="underline hover:text-light-accent dark:hover:text-dark-accent transition-colors"
            >
              search
            </Link>{" "}
          </div>
          <div className="text-black-400">•</div>
          <Link
            href="/viz"
            className="underline hover:text-light-accent dark:hover:text-dark-accent transition-colors"
          >
            viz
          </Link>
        </div>

        <div className="mb-6">
          <Heatmap
            posts={allPosts}
            year={selectedYear}
            month={0}
            showNavigation={true}
            navigationPath="/posts"
          />
        </div>

        <div className="space-y-1 hover:space-y-2 transition-all duration-300">
          {postPreviews}
        </div>
      </div>
    </div>
  );
}
