import type { PostMetadata } from "@/types/post";
import type { PostPreviewData } from "@/utils/content/preview";
import PostPreview from "./PostPreview";

export type PostListEntry = Pick<PostMetadata, "title" | "slug" | "date"> & {
  preview?: PostPreviewData;
};

/** One row layout and rhythm for archive formats, destinations, and topics. */
export default function PostList({
  posts,
  showYear = true,
}: {
  posts: PostListEntry[];
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
