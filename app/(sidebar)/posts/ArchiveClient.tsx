"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { PostFormat, PostMetadata } from "@/types/post";
import { countTagFrequency } from "@/utils/content/tags";
import PostLinkPreview from "@/components/posts/PostLinkPreview";
import Heatmap from "@/components/visualizations/Heatmap";
import Link from "next/link";
import {
  POST_FORMATS,
  formatConfig,
  isPostFormat,
  matchesFormat,
} from "@/utils/content/formats";

type View = "all" | PostFormat | "tags";
const VIEWS = [{ id: "all", label: "all" }, ...POST_FORMATS] as const;

const byYear = (posts: PostMetadata[]) => {
  const years = new Map<number, PostMetadata[]>();
  for (const post of posts) {
    const year = new Date(post.date).getFullYear();
    years.set(year, [...(years.get(year) ?? []), post]);
  }
  return [...years].sort(([a], [b]) => b - a);
};

const YearLink = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) => (
  <Link
    href={href}
    scroll={false}
    className="text-accent/35 hover:text-accent/70 transition-[color] duration-150"
  >
    {children}
  </Link>
);

// Title, dotted leader, then the day; the year is the section heading.
function PostRow({ post }: { post: PostMetadata }) {
  return (
    <PostLinkPreview
      slug={post.slug}
      className="group flex items-baseline gap-3 cursor-crosshair text-sm md:text-base"
    >
      <span className="text-accent group-hover:underline">{post.title}</span>
      <span
        aria-hidden
        className="flex-1 min-w-4 border-b border-dotted border-rule dark:border-night-rule translate-y-[-0.3em]"
      />
      <span className="text-muted shrink-0 text-xs md:text-sm tabular-nums">
        {post.date.replace(/,? \d{4}$/, "")}
      </span>
    </PostLinkPreview>
  );
}

export default function ArchiveClient({
  allPosts,
}: {
  allPosts: PostMetadata[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [prefetchTag, setPrefetchTag] = useState<string | null>(null);

  // Keep old list/year URLs working; favorites now points to essays.
  const param = searchParams.get("view");
  const view: View =
    param === "favorites"
      ? "essay"
      : isPostFormat(param) || param === "tags"
        ? param
        : "all";

  const viewHref = (v: View, year?: number) => {
    const params = new URLSearchParams();
    if (v !== "all") params.set("view", v);
    if (year) params.set("year", String(year));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const sortedTags = countTagFrequency(allPosts);
  const posts = isPostFormat(view)
    ? allPosts.filter((post) => matchesFormat(post, view))
    : allPosts;
  const config = isPostFormat(view) ? formatConfig(view) : undefined;
  // All and journal retain year navigation; smaller formats show all years.
  const yearly = view === "all" || view === "journal";
  const years = byYear(posts);
  const yearParam = Number(searchParams.get("year"));
  const index = Math.max(
    0,
    years.findIndex(([y]) => y === yearParam)
  );
  const [year, yearPosts] = years[index] ?? [undefined, []];
  const newer = years[index - 1]?.[0];
  const older = years[index + 1]?.[0];
  const words = (list: PostMetadata[]) =>
    new Intl.NumberFormat().format(
      list.reduce((sum, p) => sum + p.wordcount, 0)
    );

  return (
    <div>
      <h1 className="sr-only">
        {config?.heading ?? (view === "tags" ? "tags" : "archive")}
      </h1>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {VIEWS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => router.push(viewHref(id))}
              aria-pressed={view === id}
              className={`transition-[color] duration-150 ${
                view === id
                  ? "text-accent"
                  : "text-accent/35 hover:text-accent/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Link
          href="/search"
          className="shrink-0 mt-1 text-accent/35 hover:text-accent/70 transition-[color] duration-150"
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

      {view === "all" && (
        <nav
          aria-label="Topics"
          className="flex flex-wrap gap-x-3 gap-y-2 text-xs mb-8"
        >
          {sortedTags.slice(0, 10).map(([tag]) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              prefetch={false}
              className="text-muted hover:text-accent"
            >
              #{tag}
            </Link>
          ))}
          <Link href="/tags" className="text-accent hover:underline">
            all tags →
          </Link>
        </nav>
      )}

      {config && (
        <div className="mb-6">
          <h2 className="text-base font-bold text-primary">{config.heading}</h2>
          <p className="mt-1 text-sm text-muted">{config.description}</p>
        </div>
      )}
      {view !== "tags" && posts.length === 0 && (
        <p className="text-sm text-muted">Nothing here yet.</p>
      )}

      {yearly && year && (
        <section>
          <div className="flex items-baseline justify-between mb-3 text-sm tabular-nums">
            <div className="flex items-baseline gap-4">
              {older && (
                <YearLink href={viewHref(view, older)}>← {older}</YearLink>
              )}
              <h2 className="text-accent">{year}</h2>
              {newer && (
                <YearLink href={viewHref(view, newer)}>{newer} →</YearLink>
              )}
            </div>
            <span className="text-xs text-accent/40">
              {yearPosts.length} posts · {words(yearPosts)} words
            </span>
          </div>
          <div className="mb-5">
            <Heatmap
              posts={posts}
              year={year}
              month={0}
              showNavigation={false}
            />
          </div>
          <div className="space-y-1">
            {yearPosts.map((post) => (
              <PostRow key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      {!yearly &&
        view !== "tags" &&
        byYear(posts).map(([postYear, yearGroup]) => (
          <section key={postYear} className="mb-10">
            <h2 className="text-sm text-accent mb-3 tabular-nums">
              {postYear}
            </h2>
            <div className="space-y-1">
              {yearGroup.map((post) => (
                <PostRow key={post.slug} post={post} />
              ))}
            </div>
          </section>
        ))}

      {view === "tags" && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-0">
          {sortedTags.map(([tag, count]) => (
            <Link
              href={`/tags/${encodeURIComponent(tag)}`}
              key={tag}
              prefetch={prefetchTag === tag ? null : false}
              onMouseEnter={() => setPrefetchTag(tag)}
              onFocus={() => setPrefetchTag(tag)}
              className="border border-rule dark:border-night-raised hover:bg-accent/5 px-2 py-1.5 flex justify-between items-center gap-1.5 transition-colors duration-150"
            >
              <span className="text-xs text-accent truncate">{tag}</span>
              <span className="text-[10px] text-accent/30 font-mono shrink-0">
                {count}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
