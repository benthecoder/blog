import Link from "next/link";
import type { ReactNode } from "react";
import { ParsedPost, PostMetadata } from "@/types/post";
import { extractTags } from "@/utils/content/tags";
import PostViewTracker from "./PostViewTracker";

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

          <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
            {date && (
              <span className="text-ink-soft dark:text-ink-soft text-xs">
                {new Date(date as string).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
            {tags.length > 0 && (
              <>
                <span className="text-rule dark:text-ink/50 text-xs">·</span>
                {tags.map((tag) => (
                  <Link
                    href={`/tags/${tag}`}
                    key={tag}
                    className="text-xs text-ink-soft dark:text-ink-soft hover:text-ink dark:hover:text-chalk transition-colors duration-150"
                  >
                    #{tag}
                  </Link>
                ))}
              </>
            )}
            {readingTime && (
              <>
                <span className="text-rule dark:text-ink/50 text-xs">·</span>
                <span className="text-ink-soft dark:text-ink-soft text-xs">
                  {readingTime} min read
                </span>
              </>
            )}
            {slug && (
              <>
                <span className="text-rule dark:text-ink/50 text-xs">·</span>
                <PostViewTracker slug={slug} />
              </>
            )}
          </div>
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
