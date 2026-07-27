import Link from "next/link";
import type { ReactNode } from "react";
import { ParsedPost, PostMetadata } from "@/types/post";
import { extractTags } from "@/utils/content/tags";
import PostViewTracker from "./PostViewTracker";

// Separator between metadata facts. Dimmed so the eye groups the line as one
// unit instead of counting four items.
const Dot = () => (
  <span aria-hidden="true" className="opacity-40">
    ·
  </span>
);

interface RenderPostProps {
  post: ParsedPost;
  prev: PostMetadata | null;
  next: PostMetadata | null;
  slug: string | null;
  wordcount?: number;
  children: ReactNode;
}

const RenderPost = ({
  post,
  prev,
  next,
  slug,
  wordcount,
  children,
}: RenderPostProps) => {
  const { title, date } = post.data;
  const tags = extractTags(post.data);
  const readingTime =
    wordcount && wordcount > 0
      ? Math.max(1, Math.round(wordcount / 200))
      : null;

  return (
    <div>
      <div className="p-5 bg-paper-raised dark:bg-night-raised shadow-xs rounded-md dark:text-chalk-strong">
        <div className="text-center mb-4">
          {slug ? (
            <Link href={`/posts/${slug}`}>
              <h2 className="font-bold text-xl md:text-2xl text-ink dark:text-chalk-strong">
                {title as string}
              </h2>
            </Link>
          ) : (
            <h2 className="font-bold text-xl md:text-2xl text-ink dark:text-chalk-strong">
              {title as string}
            </h2>
          )}

          {/* Passive facts: read once, then ignored — so they share one quiet
              line at a single weight, well below the title. */}
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] leading-none text-ink-muted dark:text-chalk-muted">
            {date && (
              <time dateTime={new Date(date as string).toISOString()}>
                {new Date(date as string).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            )}
            {readingTime && (
              <>
                <Dot />
                <span className="tabular-nums">{readingTime} min read</span>
              </>
            )}
            {slug && (
              <>
                <Dot />
                <PostViewTracker slug={slug} />
              </>
            )}
          </div>

          {/* Tags are navigation, not metadata — given their own row and a
              tappable shape so they don't read as more of the same. */}
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              {tags.map((tag) => (
                <Link
                  href={`/tags/${tag}`}
                  key={tag}
                  className="rounded-full bg-ink/6 px-2 py-0.5 text-[11px] leading-5 text-ink transition-colors duration-150 hover:bg-ink/12 hover:text-ink-strong dark:bg-chalk/10 dark:text-chalk dark:hover:bg-chalk/20 dark:hover:text-chalk-strong"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>

        <article className="prose dark:prose-invert dark:text-chalk text-sm md:text-base leading-relaxed max-w-none selection:bg-paper-tint/30 dark:selection:bg-chalk-soft/20 prose-a:text-ink prose-a:decoration-paper-warm/50 prose-a:hover:text-ink/70 prose-a:hover:decoration-ink prose-headings:text-ink dark:prose-headings:text-chalk-soft">
          {children}
        </article>
      </div>

      <div className="mt-8 flex justify-between text-xs gap-4">
        {prev ? (
          <div className="flex flex-col flex-1">
            <p className="text-ink-strong/40 dark:text-chalk-strong/40 mb-1">
              Previous
            </p>
            <Link
              href={`/posts/${prev.slug}`}
              className="text-ink-strong dark:text-chalk-strong hover:text-ink dark:hover:text-chalk-soft transition-colors"
            >
              {prev.title}
            </Link>
          </div>
        ) : (
          <div className="flex-1" />
        )}
        {next ? (
          <div className="flex flex-col flex-1 text-right">
            <p className="text-ink-strong/40 dark:text-chalk-strong/40 mb-1">
              Next
            </p>
            <Link
              href={`/posts/${next.slug}`}
              className="text-ink-strong dark:text-chalk-strong hover:text-ink dark:hover:text-chalk-soft transition-colors"
            >
              {next.title}
            </Link>
          </div>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
};

export default RenderPost;
