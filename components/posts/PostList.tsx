import type { PostMetadata } from "@/types/post";
import PostPreview from "./PostPreview";

/** One row layout and rhythm for archive formats, destinations, and topics. */
export default function PostList({
  posts,
  showYear = true,
}: {
  posts: Pick<PostMetadata, "title" | "slug" | "date">[];
  showYear?: boolean;
}) {
  return (
    <div className="space-y-1">
      {posts.map((post) => (
        <PostPreview key={post.slug} {...post} showYear={showYear} />
      ))}
    </div>
  );
}
