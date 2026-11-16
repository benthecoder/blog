import Link from "next/link";
import type { SameDayPost } from "@/utils/content/onThisDay";
import { FooterGroup, footerLink } from "./FooterGroup";

const OnThisDay = ({ posts }: { posts: SameDayPost[] }) => {
  if (posts.length === 0) return null;

  return (
    <FooterGroup label="On this day">
      <ul className="space-y-1">
        {posts.map((post) => (
          <li key={post.slug} className="flex gap-3">
            <span className="shrink-0 text-muted tabular-nums">
              {post.year}
            </span>
            <Link href={`/posts/${post.slug}`} className={footerLink}>
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </FooterGroup>
  );
};

export default OnThisDay;
