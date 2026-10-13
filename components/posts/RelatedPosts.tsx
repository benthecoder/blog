import Link from "next/link";
import type { RelatedPost } from "@/utils/content/related";

const RelatedPosts = ({ posts }: { posts: RelatedPost[] }) => {
  if (posts.length === 0) return null;

  return (
    <div className="mt-8 text-xs">
      <p className="text-primary/60 mb-1">Similar</p>
      <ul className="space-y-1">
        {posts.map((post) => (
          <li key={post.slug}>
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

export default RelatedPosts;
