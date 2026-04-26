"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { PostMetadata } from "@/types/post";
import PostPreview from "@/components/posts/PostPreview";
import Heatmap from "@/components/visualizations/Heatmap";
import Link from "next/link";

const KnowledgeMap = dynamic(
  () => import("@/components/visualizations/KnowledgeMap"),
  { ssr: false }
);

type View = "list" | "year" | "map" | "tags";
type Sort = "date" | "views" | "length";
const PAGE_SIZE = 50;
const VIEWS: View[] = ["list", "year", "map", "tags"];

const labelCls =
  "text-[10px] tracking-widest uppercase text-japanese-sumiiro/30 dark:text-japanese-shironezu/30";

function paginationRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const delta = 1;
  const left = current - delta;
  const right = current + delta;
  const pages: (number | "…")[] = [];
  let prev = 0;
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= left && p <= right)) {
      if (prev && p - prev > 1) pages.push("…");
      pages.push(p);
      prev = p;
    }
  }
  return pages;
}

function countTags(posts: PostMetadata[]): [string, number][] {
  const counts: Record<string, number> = {};
  posts.forEach((post) =>
    post.tags.split(",").forEach((t) => {
      const tag = t.trim();
      if (tag && tag !== "✰") counts[tag] = (counts[tag] || 0) + 1;
    })
  );
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export default function ArchiveClient({
  allPosts,
}: {
  allPosts: PostMetadata[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<Sort>("date");
  const [viewCounts, setViewCounts] = useState<Map<string, number> | null>(
    null
  );
  const [viewsLoading, setViewsLoading] = useState(false);

  const view = (searchParams.get("view") as View) || "list";
  const selectedYear = useMemo(() => {
    const param = searchParams.get("year");
    return param
      ? parseInt(param, 10)
      : allPosts.length > 0
        ? new Date(allPosts[0].date).getFullYear()
        : new Date().getFullYear();
  }, [searchParams, allPosts]);

  // Fetch view counts lazily when sort=views is selected
  useEffect(() => {
    if (sort !== "views" || viewCounts !== null || viewsLoading) return;
    setViewsLoading(true);
    fetch("/api/views")
      .then((r) => r.json())
      .then((d) => {
        const map = new Map<string, number>(
          (d.results ?? []).map((r: { slug: string; count: number }) => [
            r.slug,
            r.count,
          ])
        );
        setViewCounts(map);
      })
      .catch(() => setViewCounts(new Map()))
      .finally(() => setViewsLoading(false));
  }, [sort, viewCounts, viewsLoading]);

  const setView = (v: View) => {
    const params = new URLSearchParams(searchParams.toString());
    v === "list" ? params.delete("view") : params.set("view", v);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSort = (s: Sort) => {
    setSort(s);
    setPage(1);
  };

  const sortedTags = useMemo(() => countTags(allPosts), [allPosts]);

  const { starredPosts, regularPosts } = useMemo(() => {
    const starred = allPosts.filter((p) => p.tags.includes("✰"));
    const regular = allPosts.filter((p) => !p.tags.includes("✰"));
    return { starredPosts: starred, regularPosts: regular };
  }, [allPosts]);

  const sortedRegular = useMemo(() => {
    if (sort === "length") {
      return [...regularPosts].sort((a, b) => b.wordcount - a.wordcount);
    }
    if (sort === "views" && viewCounts) {
      return [...regularPosts].sort(
        (a, b) => (viewCounts.get(b.slug) ?? 0) - (viewCounts.get(a.slug) ?? 0)
      );
    }
    // default: date descending
    return [...regularPosts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [regularPosts, sort, viewCounts]);

  const totalPages = Math.ceil(sortedRegular.length / PAGE_SIZE);
  const pagedRegular = sortedRegular.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );
  const totalWords = useMemo(
    () => allPosts.reduce((sum, p) => sum + p.wordcount, 0),
    [allPosts]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4 text-sm">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`transition-[color] duration-150 ${
                view === v
                  ? "text-japanese-sumiiro dark:text-japanese-shironezu"
                  : "text-japanese-sumiiro/35 dark:text-japanese-shironezu/35 hover:text-japanese-sumiiro/70 dark:hover:text-japanese-shironezu/70"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-japanese-sumiiro/40 dark:text-japanese-shironezu/40 tabular-nums">
            {allPosts.length} posts ·{" "}
            {new Intl.NumberFormat().format(totalWords)} words
          </span>
          <Link
            href="/search"
            className="text-japanese-sumiiro/35 dark:text-japanese-shironezu/35 hover:text-japanese-sumiiro/70 dark:hover:text-japanese-shironezu/70 transition-[color] duration-150"
            aria-label="search"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </Link>
        </div>
      </div>

      {view === "list" && (
        <>
          {starredPosts.length > 0 && (
            <>
              <p className={`${labelCls} mb-2`}>favorites ✰</p>
              <div className="space-y-1 mb-6 pb-6 border-b border-japanese-shiraumenezu dark:border-white/[0.06]">
                {starredPosts.map((post) => (
                  <PostPreview key={post.slug} {...post} />
                ))}
              </div>
            </>
          )}

          <div className="flex items-center justify-between mb-2">
            <p className={labelCls}>all</p>
            <div className="flex items-center border border-japanese-shiraumenezu dark:border-white/[0.08] divide-x divide-japanese-shiraumenezu dark:divide-white/[0.08]">
              {(["date", "views", "length"] as Sort[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSort(s)}
                  className={`px-2.5 py-1 text-[10px] transition-[background-color,color] duration-150 ${
                    sort === s
                      ? "bg-japanese-sumiiro/8 dark:bg-japanese-shironezu/8 text-japanese-sumiiro dark:text-japanese-shironezu"
                      : "text-japanese-sumiiro/35 dark:text-japanese-shironezu/35 hover:text-japanese-sumiiro/60 dark:hover:text-japanese-shironezu/60"
                  }`}
                >
                  {s === "views" && viewsLoading ? "…" : s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            {pagedRegular.map((post) => (
              <PostPreview key={post.slug} {...post} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-1 mt-6">
              {paginationRange(page, totalPages).map((p, i) =>
                p === "…" ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="w-7 h-7 flex items-center justify-center text-xs text-japanese-sumiiro/30 dark:text-japanese-shironezu/30"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 text-xs tabular-nums border transition-[border-color,color] duration-150 ${
                      p === page
                        ? "border-japanese-sumiiro/60 dark:border-japanese-shironezu/60 text-japanese-sumiiro dark:text-japanese-shironezu"
                        : "border-japanese-shiraumenezu dark:border-white/[0.08] text-japanese-sumiiro/40 dark:text-japanese-shironezu/40 hover:border-japanese-sumiiro/40 dark:hover:border-japanese-shironezu/40"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
          )}
        </>
      )}

      {view === "year" && (
        <>
          <Heatmap
            posts={allPosts}
            year={selectedYear}
            month={0}
            showNavigation={true}
            navigationPath="/posts?view=year"
          />
          <div className="space-y-1 mt-6">
            {allPosts
              .filter((p) => new Date(p.date).getFullYear() === selectedYear)
              .map((post) => (
                <PostPreview key={post.slug} {...post} />
              ))}
          </div>
        </>
      )}

      {view === "map" && (
        <div className="h-[70vh] overflow-hidden border border-japanese-shiraumenezu dark:border-white/[0.08]">
          <KnowledgeMap className="w-full h-full" />
        </div>
      )}

      {view === "tags" && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-0">
          {sortedTags.map(([tag, count]) => (
            <Link href={`/tags/${tag}`} key={tag}>
              <div className="border border-light-border dark:border-dark-tag hover:bg-japanese-sumiiro/5 dark:hover:bg-japanese-shironezu/5 px-2 py-1.5 flex justify-between items-center gap-1.5 transition-colors duration-150">
                <span className="text-xs text-japanese-sumiiro dark:text-japanese-shironezu truncate">
                  {tag}
                </span>
                <span className="text-[10px] text-japanese-sumiiro/30 dark:text-japanese-shironezu/30 font-mono shrink-0">
                  {count}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
