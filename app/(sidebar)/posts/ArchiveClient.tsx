"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { PostMetadata } from "@/types/post";
import { FAVORITE, countTagFrequency } from "@/utils/content/tags";
import PostLinkPreview from "@/components/posts/PostLinkPreview";
import Heatmap from "@/components/visualizations/Heatmap";
import Link from "next/link";

type View = "list" | "favorites" | "tags";
const VIEWS: View[] = ["list", "favorites", "tags"];

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
      <span className="text-accent group-hover:underline">
        {post.title}
        {post.tags.includes(FAVORITE) && (
          <span className="text-muted ml-1.5" aria-label="favorite">
            {FAVORITE}
          </span>
        )}
      </span>
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

  // Old ?view=year links fall back to the list, which reads the same ?year.
  const param = searchParams.get("view");
  const view: View = VIEWS.includes(param as View) ? (param as View) : "list";

  const setView = (v: View) => {
    const params = new URLSearchParams();
    if (v !== "list") params.set("view", v);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const sortedTags = countTagFrequency(allPosts, [FAVORITE]);
  const posts =
    view === "favorites"
      ? allPosts.filter((p) => p.tags.includes(FAVORITE))
      : allPosts;
  // The list shows one year at a time, newest first; ?year= picks another.
  const years = byYear(allPosts);
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
      <h1 className="sr-only">archive</h1>
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-4 text-sm">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`transition-[color] duration-150 ${
                view === v
                  ? "text-accent"
                  : "text-accent/35 hover:text-accent/70"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <Link
          href="/search"
          className="text-accent/35 hover:text-accent/70 transition-[color] duration-150"
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

      {view === "list" && year && (
        <section>
          <div className="flex items-baseline justify-between mb-3 text-sm tabular-nums">
            <div className="flex items-baseline gap-4">
              {older && (
                <YearLink href={`${pathname}?year=${older}`}>
                  ← {older}
                </YearLink>
              )}
              <h2 className="text-accent">{year}</h2>
              {newer && (
                <YearLink href={`${pathname}?year=${newer}`}>
                  {newer} →
                </YearLink>
              )}
            </div>
            <span className="text-xs text-accent/40">
              {yearPosts.length} posts · {words(yearPosts)} words
            </span>
          </div>
          <div className="mb-5">
            <Heatmap
              posts={allPosts}
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

      {view === "favorites" &&
        byYear(posts).map(([favYear, favPosts]) => (
          <section key={favYear} className="mb-10">
            <h2 className="text-sm text-accent mb-3 tabular-nums">{favYear}</h2>
            <div className="space-y-1">
              {favPosts.map((post) => (
                <PostRow key={post.slug} post={post} />
              ))}
            </div>
          </section>
        ))}

      {view === "tags" && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-0">
          {sortedTags.map(([tag, count]) => (
            <Link
              href={`/tags/${tag}`}
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
