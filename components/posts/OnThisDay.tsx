import Link from "next/link";
import type { SameDayPost } from "@/utils/content/onThisDay";

const OnThisDay = ({ posts }: { posts: SameDayPost[] }) => {
  if (posts.length === 0) return null;

  return (
    <div className="mt-8 text-xs">
      <p className="text-primary/60 mb-1">On this day</p>
      <ul className="space-y-1">
        {posts.map((post) => (
          <li key={post.slug}>
            <span className="text-primary/60 tabular-nums mr-2">
              {post.year}
            </span>
            <Link
              href={`/posts/${post.slug}`}
              className="text-primary hover:text-ink dark:hover:text-chalk-soft transition-colors"
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OnThisDay;
