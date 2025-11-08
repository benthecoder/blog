import Link from "next/link";
import MarkdownContent from "./MarkdownContent";

const RenderPost = ({ post, prev, next, slug }: any) => {
  return (
    <div>
      <div
        key={post.data.title}
        className="p-4 bg-gradient-to-br from-japanese-hakuji to-japanese-unoharairo dark:from-gray-900 dark:to-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 dark:text-japanese-nyuhakushoku border-l-4 border-japanese-soshoku dark:border-japanese-murasakisuishiyou hover:border-japanese-nezumiiro dark:hover:border-japanese-shironezu/70"
      >
        {/* Title */}
        <div className="text-center">
          {slug ? (
            <Link href={`/posts/${slug}`}>
              <h2 className="font-bold text-xl md:text-2xl text-japanese-sumiiro dark:text-japanese-nyuhakushoku hover:text-japanese-sumiiro/80 dark:hover:text-japanese-shironezu transition-colors duration-200">
                {post.data.title}
              </h2>
            </Link>
          ) : (
            <h2 className="font-bold text-xl md:text-2xl text-japanese-sumiiro dark:text-japanese-nyuhakushoku">
              {post.data.title}
            </h2>
          )}

          {/* Date */}
          <p className="text-japanese-nezumiiro/80 dark:text-japanese-murasakisuishiyou/60 text-sm mt-2 font-light tracking-wide">
            {new Date(post.data.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Tags */}
        <div className="mt-2 flex flex-wrap justify-center gap-2 mb-4">
          {post.data.tags.split(", ").map((tag: any) => (
            <Link
              href={`/tags/${tag}`}
              key={tag}
              className="px-3 py-1 text-xs rounded-full bg-gradient-to-r from-japanese-soshoku/20 to-japanese-shiraumenezu/20 text-japanese-sumiiro hover:from-japanese-soshoku hover:to-japanese-shiraumenezu hover:text-japanese-sumiiro/90 transition-all duration-200 dark:from-japanese-murasakisuishiyou/10 dark:to-japanese-ginnezu/10 dark:text-japanese-shironezu dark:hover:from-japanese-murasakisuishiyou/30 dark:hover:to-japanese-ginnezu/30 dark:hover:text-white"
            >
              #{tag}
            </Link>
          ))}
        </div>

        <hr className="border-0 h-px bg-gradient-to-r from-transparent via-japanese-shiraumenezu to-transparent dark:via-japanese-murasakisuishiyou/30 mb-3" />

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
