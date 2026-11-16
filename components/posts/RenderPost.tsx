import Link from "next/link";
import type { ReactNode } from "react";
import { ParsedPost, PostMetadata } from "@/types/post";
import type { RelatedPost } from "@/utils/content/related";
import type { SameDayPost } from "@/utils/content/onThisDay";
import type { TocEntry } from "@/utils/content/toc";
import { extractTags } from "@/utils/content/tags";
import { parsePostDate } from "@/utils/dateUtils";
import OnThisDay from "./OnThisDay";
import { FooterGroup, footerLink } from "./FooterGroup";
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
  "prose dark:prose-invert text-base leading-relaxed max-w-none prose-headings:scroll-mt-8";

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
    <div className="relative min-w-0 max-w-[65ch] mx-auto wrap-anywhere">
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

      <footer className="mt-16 space-y-10 text-sm leading-relaxed">
        {(tags.length > 0 || slug) && (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-muted">
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

        {(prev || next) && (
          <nav aria-label="More posts" className="flex justify-between gap-6">
            {prev ? (
              <FooterGroup label="Previous" className="flex-1">
                <Link href={`/posts/${prev.slug}`} className={footerLink}>
                  {prev.title}
                </Link>
              </FooterGroup>
            ) : (
              <div className="flex-1" />
            )}
            {next ? (
              <FooterGroup label="Next" className="flex-1 text-right">
                <Link href={`/posts/${next.slug}`} className={footerLink}>
                  {next.title}
                </Link>
              </FooterGroup>
            ) : (
              <div className="flex-1" />
            )}
          </nav>
        )}
      </footer>
    </div>
  );
};

export default RenderPost;
