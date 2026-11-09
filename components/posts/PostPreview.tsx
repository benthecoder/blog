import type { PostMetadata } from "@/types/post";
import PostLinkPreview from "./PostLinkPreview";

const PostPreview = ({
  title,
  slug,
  date,
  showYear = true,
}: Pick<PostMetadata, "title" | "slug" | "date"> & { showYear?: boolean }) => {
  return (
    <PostLinkPreview
      slug={slug}
      className="group flex items-baseline gap-3 cursor-crosshair text-sm md:text-base"
    >
      <span className="text-accent group-hover:underline">{title}</span>
      <span
        aria-hidden
        className="flex-1 min-w-4 border-b border-dotted border-line translate-y-[-0.3em]"
      />
      <span className="text-muted shrink-0 text-xs md:text-sm tabular-nums">
        {showYear ? date : date.replace(/,? \d{4}$/, "")}
      </span>
    </PostLinkPreview>
  );
};

export default PostPreview;
