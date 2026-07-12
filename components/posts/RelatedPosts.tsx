import Link from "next/link";
import type { RelatedPost } from "@/utils/content/related";

const RelatedPosts = ({ posts }: { posts: RelatedPost[] }) => {
  if (posts.length === 0) return null;

  return (
    <div className="mt-8 text-xs">
      <p className="text-light-text/40 dark:text-dark-text/40 mb-1">Similar</p>
      <ul className="space-y-1">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/posts/${post.slug}`}
              className="text-light-text dark:text-dark-text hover:text-light-accent dark:hover:text-dark-accent transition-colors"
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RelatedPosts;
