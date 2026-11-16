import Link from "next/link";
import type { RelatedPost } from "@/utils/content/related";
import { FooterGroup, footerLink } from "./FooterGroup";

const RelatedPosts = ({ posts }: { posts: RelatedPost[] }) => {
  if (posts.length === 0) return null;

  return (
    <FooterGroup label="Similar">
      <ul className="space-y-1">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/posts/${post.slug}`} className={footerLink}>
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </FooterGroup>
  );
};

export default RelatedPosts;
