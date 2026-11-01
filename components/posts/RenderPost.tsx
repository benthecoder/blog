import Link from "next/link";
import type { ReactNode } from "react";
import { ParsedPost, PostMetadata } from "@/types/post";
import type { RelatedPost } from "@/utils/content/related";
import type { SameDayPost } from "@/utils/content/onThisDay";
import type { TocEntry } from "@/utils/content/toc";
import { extractTags } from "@/utils/content/tags";
import { parsePostDate } from "@/utils/dateUtils";
import OnThisDay from "./OnThisDay";
import PostArrowKeys from "./PostArrowKeys";
import PostViewTracker from "./PostViewTracker";
import RelatedPosts from "./RelatedPosts";
import TableOfContents from "./TableOfContents";

interface RenderPostProps {
  post: ParsedPost;
  prev: PostMetadata | null;
  next: PostMetadata | null;
  slug: string | null;
  wordcount?: number;
  toc?: TocEntry[];
  related?: RelatedPost[];
  onThisDay?: SameDayPost[];
  hero?: ReactNode;
  backlinks?: ReactNode;
  children: ReactNode;
}

const proseClasses =
  "prose dark:prose-invert dark:text-chalk text-base leading-relaxed max-w-none prose-headings:scroll-mt-8 selection:bg-paper-tint/30 dark:selection:bg-chalk-soft/20 prose-a:text-ink prose-a:decoration-paper-warm/50 prose-a:hover:text-ink/70 prose-a:hover:decoration-ink prose-headings:text-ink dark:prose-headings:text-chalk-soft";

const RenderPost = ({
  post,
  prev,
  next,
  slug,
  wordcount,
  toc,
  related,
  onThisDay,
  hero,
  backlinks,
  children,
}: RenderPostProps) => {
  const { title, date } = post.data;
  const tags = extractTags(post.data);
  const readingTime =
    wordcount && wordcount > 0
      ? Math.max(1, Math.round(wordcount / 200))
      : null;

  const meta = [
    date &&
      parsePostDate(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    readingTime && `${readingTime} min read`,
  ]
    .filter(Boolean)
    .join(" · ");

  const heading = (
    <h1 className="font-bold text-2xl md:text-4xl leading-tight tracking-tight text-balance text-ink dark:text-chalk-strong">
      {title}
    </h1>
  );

  return (
    <div className="relative max-w-[65ch] mx-auto">
      {(prev || next) && (
        <PostArrowKeys
          prevHref={prev ? `/posts/${prev.slug}` : undefined}
          nextHref={next ? `/posts/${next.slug}` : undefined}
        />
      )}
      <header className="mb-10">
        {slug ? <Link href={`/posts/${slug}`}>{heading}</Link> : heading}
        {meta && (
          <p className="mt-2 text-sm text-ink-soft dark:text-chalk-muted">
            {meta}
          </p>
        )}
      </header>

      {hero && (
        <div className={`${proseClasses} mb-8 [&_figure]:my-0`}>{hero}</div>
      )}

      {toc && <TableOfContents items={toc} />}

      <article className={proseClasses}>{children}</article>

      {backlinks}

      <footer className="mt-12 pt-5 border-t border-line text-xs">
        {(tags.length > 0 || slug) && (
          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-ink-soft dark:text-chalk-muted">
            {tags.map((tag) => (
              <Link
                href={`/tags/${tag}`}
                key={tag}
                className="hover:text-accent transition-colors duration-150"
              >
                #{tag}
              </Link>
            ))}
            {slug && (
              <span className="ml-auto">
                <PostViewTracker slug={slug} />
              </span>
            )}
          </div>
        )}

        {related && related.length > 0 && <RelatedPosts posts={related} />}

        {onThisDay && <OnThisDay posts={onThisDay} />}

        <div className="mt-8 flex justify-between gap-4">
          {prev ? (
            <div className="flex flex-col flex-1">
              <p className="text-primary/60 mb-1">Previous</p>
              <Link
                href={`/posts/${prev.slug}`}
                className="text-primary hover:text-ink dark:hover:text-chalk-soft transition-colors"
              >
                {prev.title}
              </Link>
            </div>
          ) : (
            <div className="flex-1" />
          )}
          {next ? (
            <div className="flex flex-col flex-1 text-right">
              <p className="text-primary/60 mb-1">Next</p>
              <Link
                href={`/posts/${next.slug}`}
                className="text-primary hover:text-ink dark:hover:text-chalk-soft transition-colors"
              >
                {next.title}
              </Link>
            </div>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </footer>
    </div>
  );
};

export default RenderPost;
