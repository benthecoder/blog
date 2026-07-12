import Link from "next/link";
import type { ReactNode } from "react";
import { ParsedPost, PostMetadata } from "@/types/post";
import type { RelatedPost } from "@/utils/content/related";
import type { TocEntry } from "@/utils/content/toc";
import { extractTags } from "@/utils/content/tags";
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
  hero?: ReactNode;
  children: ReactNode;
}

const proseClasses =
  "prose dark:prose-invert dark:text-japanese-shironezu text-base leading-relaxed max-w-none prose-headings:scroll-mt-8 selection:bg-japanese-unoharairo/30 dark:selection:bg-japanese-murasakisuishiyou/20 prose-a:text-japanese-sumiiro prose-a:decoration-japanese-soshoku/50 prose-a:hover:text-japanese-sumiiro/70 prose-a:hover:decoration-japanese-sumiiro prose-headings:text-japanese-sumiiro dark:prose-headings:text-japanese-murasakisuishiyou";

const RenderPost = ({
  post,
  prev,
  next,
  slug,
  wordcount,
  toc,
  related,
  hero,
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
      new Date(date as string).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    readingTime && `${readingTime} min read`,
  ]
    .filter(Boolean)
    .join(" · ");

  const heading = (
    <h1 className="font-bold text-2xl md:text-4xl tracking-tight text-balance text-japanese-sumiiro dark:text-japanese-nyuhakushoku">
      {title as string}
    </h1>
  );

  return (
    <div className="relative max-w-[65ch] mx-auto">
      <header className="mb-10">
        {slug ? <Link href={`/posts/${slug}`}>{heading}</Link> : heading}
        {meta && <p className="mt-2 text-sm text-japanese-ginnezu">{meta}</p>}
      </header>

      {hero && (
        <div className={`${proseClasses} mb-8 [&_figure]:my-0`}>{hero}</div>
      )}

      {toc && <TableOfContents items={toc} />}

      <article className={proseClasses}>{children}</article>

      <footer className="mt-12 pt-5 border-t border-light-border dark:border-dark-border text-xs">
        {(tags.length > 0 || slug) && (
          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-japanese-ginnezu">
            {tags.map((tag) => (
              <Link
                href={`/tags/${tag}`}
                key={tag}
                className="hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors duration-150"
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

        <div className="mt-8 flex justify-between gap-4">
          {prev ? (
            <div className="flex flex-col flex-1">
              <p className="text-light-text/40 dark:text-dark-text/40 mb-1">
                Previous
              </p>
              <Link
                href={`/posts/${prev.slug}`}
                className="text-light-text dark:text-dark-text hover:text-light-accent dark:hover:text-dark-accent transition-colors"
              >
                {prev.title}
              </Link>
            </div>
          ) : (
            <div className="flex-1" />
          )}
          {next ? (
            <div className="flex flex-col flex-1 text-right">
              <p className="text-light-text/40 dark:text-dark-text/40 mb-1">
                Next
              </p>
              <Link
                href={`/posts/${next.slug}`}
                className="text-light-text dark:text-dark-text hover:text-light-accent dark:hover:text-dark-accent transition-colors"
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
