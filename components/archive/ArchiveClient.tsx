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

  // Get the latest post's year
  const latestPostYear =
    allPosts.length > 0
      ? new Date(allPosts[0].date).getFullYear()
      : new Date().getFullYear();

  // Read year from URL params, fallback to latest post year
  const yearParam = searchParams.get("year");
  const selectedYear = yearParam ? parseInt(yearParam, 10) : latestPostYear;

  // Filter posts by selected year
  const filteredPosts = allPosts.filter(
    (post) => new Date(post.date).getFullYear() === selectedYear
  );

  // Calculate totals for filtered posts
  let totalWordCount = 0;
  const totalPosts = filteredPosts.length;
  filteredPosts.forEach((post) => {
    totalWordCount += post.wordcount;
  });

  const postPreviews = filteredPosts.map((post) => {
    return <PostPreview key={post.slug} {...post} />;
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-sm text-japanese-sumiiro/50 dark:text-japanese-shironezu/50">
            archive
          </h1>
          <div className="flex gap-2 text-sm text-japanese-sumiiro/50 dark:text-japanese-shironezu/50">
            <Link
              href="/tags"
              className="hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors"
            >
              tags
            </Link>
            <span>•</span>
            <Link
              href="/search"
              className="hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors"
            >
              search
            </Link>
            <span>•</span>
            <Link
              href="/viz"
              className="hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors"
            >
              cluster
            </Link>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-sm text-japanese-sumiiro/50 dark:text-japanese-shironezu/50">
          <span>{totalPosts} entries</span>
          <span>{new Intl.NumberFormat().format(totalWordCount)} words</span>
        </div>
      </div>

      <div className="mb-8">
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
  );
}
