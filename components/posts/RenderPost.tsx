import Link from "next/link";
import { PostMetadata } from "@/types/post";
import MarkdownContent from "./MarkdownContent";
import PostViewTracker from "./PostViewTracker";

interface PostData {
  title?: string;
  date?: string;
  tags?: string;
  [key: string]: unknown;
}

interface GrayMatterPost {
  data: PostData;
  content: string;
}

interface RenderPostProps {
  post: GrayMatterPost;
  prev: PostMetadata | null;
  next: PostMetadata | null;
  slug: string | null;
}

const RenderPost = ({ post, prev, next, slug }: RenderPostProps) => {
  return (
    <div>
      <div
        key={post.data.title}
        className="p-5 bg-japanese-hakuji dark:bg-dark-tag shadow-sm rounded-md dark:text-japanese-nyuhakushoku"
      >
        {/* Title + meta */}
        <div className="text-center mb-4">
          {slug ? (
            <Link href={`/posts/${slug}`}>
              <h2 className="font-bold text-xl md:text-2xl text-japanese-sumiiro dark:text-japanese-nyuhakushoku">
                {post.data.title}
              </h2>
            </Link>
          ) : (
            <h2 className="font-bold text-xl md:text-2xl text-japanese-sumiiro dark:text-japanese-nyuhakushoku">
              {post.data.title}
            </h2>
          )}

          <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
            {post.data.date && (
              <span className="text-japanese-ginnezu dark:text-japanese-ginnezu text-xs">
                {new Date(post.data.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
            {post.data.tags && (
              <>
                <span className="text-japanese-shiraumenezu dark:text-japanese-sumiiro/50 text-xs">
                  ·
                </span>
                {post.data.tags.split(", ").map((tag: string) => (
                  <Link
                    href={`/tags/${tag}`}
                    key={tag}
                    className="text-xs text-japanese-ginnezu dark:text-japanese-ginnezu hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors duration-150"
                  >
                    #{tag}
                  </Link>
                ))}
              </>
            )}
            {slug && (
              <>
                <span className="text-japanese-shiraumenezu dark:text-japanese-sumiiro/50 text-xs">
                  ·
                </span>
                <PostViewTracker slug={slug} />
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <article className="prose dark:prose-invert dark:text-japanese-shironezu text-sm md:text-base leading-relaxed max-w-none selection:bg-japanese-unoharairo/30 dark:selection:bg-japanese-murasakisuishiyou/20 prose-a:text-japanese-sumiiro prose-a:decoration-japanese-soshoku/50 hover:prose-a:text-japanese-sumiiro/70 hover:prose-a:decoration-japanese-sumiiro prose-headings:text-japanese-sumiiro dark:prose-headings:text-japanese-murasakisuishiyou">
          <MarkdownContent content={post.content} />
        </article>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between text-xs gap-4">
        {prev ? (
          <div className="flex flex-col group flex-1">
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
          <div className="flex-1"></div>
        )}
        {next ? (
          <div className="flex flex-col group flex-1 text-right">
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
          <div className="flex-1"></div>
        )}
      </div>
    </div>
  );
};

export default RenderPost;
