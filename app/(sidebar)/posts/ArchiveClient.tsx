"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { type ReactNode, useMemo } from "react";
import type { PostFormat, PostMetadata } from "@/types/post";
import { countTagFrequency } from "@/utils/content/tags";
import PostList from "@/components/posts/PostList";
import PlaceArchive from "@/components/posts/PlaceArchive";
import TagDirectory from "@/components/posts/TagDirectory";
import Heatmap from "@/components/visualizations/Heatmap";
import Link from "next/link";
import { groupTravelPosts } from "@/utils/content/travel";
import {
  POST_FORMATS,
  formatConfig,
  isPostFormat,
  matchesFormat,
} from "@/utils/content/formats";

type View = "all" | PostFormat | "places" | "tags";
const VIEWS = [
  { id: "all", label: "all" },
  ...POST_FORMATS,
  { id: "places", label: "places" },
] as const;

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

export default function ArchiveClient({
  allPosts,
}: {
  allPosts: PostMetadata[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Keep old list/year URLs working; favorites now points to essays.
  const rawView = searchParams.get("view");
  const param = rawView === "travels" ? "places" : rawView;
  const view: View =
    param === "favorites"
      ? "essay"
      : isPostFormat(param) || param === "tags" || param === "places"
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
  const placeGroups = useMemo(() => groupTravelPosts(allPosts), [allPosts]);
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
        {config?.heading ??
          (view === "tags" ? "tags" : view === "places" ? "places" : "archive")}
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
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/tags"
            aria-label="browse tags"
            title="tags"
            className="inline-flex h-6 w-6 items-center justify-center text-accent/35 hover:text-accent/70 transition-[color] duration-150"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-3.5 w-3.5"
            >
              <path d="M4 9h16M3 15h16M10 3 8 21M16 3l-2 18" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={() => document.dispatchEvent(new Event("openSearch"))}
            className="inline-flex h-6 w-6 items-center justify-center text-accent/35 hover:text-accent/70 transition-[color] duration-150"
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
          </button>
        </div>
      </div>

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
          {view === "journal" && (
            <div className="mb-5">
              <Heatmap
                posts={posts}
                year={year}
                month={0}
                showNavigation={false}
              />
            </div>
          )}
          <PostList posts={yearPosts} showYear={false} />
        </section>
      )}

      {view === "places" && <PlaceArchive groups={placeGroups} />}

      {view === "essay" && <PostList posts={posts} />}

      {!yearly &&
        view !== "essay" &&
        view !== "places" &&
        view !== "tags" &&
        byYear(posts).map(([postYear, yearGroup]) => (
          <section key={postYear} className="mb-10">
            <h2 className="text-sm text-accent mb-3 tabular-nums">
              {postYear}
            </h2>
            <PostList posts={yearGroup} showYear={false} />
          </section>
        ))}

      {view === "tags" && <TagDirectory tags={sortedTags} />}
    </div>
  );
}
