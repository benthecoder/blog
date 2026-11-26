import type { PostFormat, PostMetadata } from "@/types/post";
import PostLinkPreview from "./PostLinkPreview";

function titleClass(format?: PostFormat) {
  if (format === "essay" || format === "book") {
    return "text-lg font-medium text-accent group-hover:underline";
  }
  if (format === "links" || format === "resource") {
    return "text-sm text-accent group-hover:underline";
  }
  return "text-base text-accent group-hover:underline";
}

const PostPreview = ({
  title,
  slug,
  date,
  format,
  showYear = true,
}: Pick<PostMetadata, "title" | "slug" | "date" | "format"> & {
  showYear?: boolean;
}) => {
  return (
    <PostLinkPreview
      slug={slug}
      className="group flex items-baseline gap-3 cursor-crosshair"
    >
      <span className={titleClass(format)}>{title}</span>
      <span
        aria-hidden
        className="flex-1 min-w-4 border-b border-dotted border-line translate-y-[-0.3em]"
      />
      <span className="text-muted shrink-0 text-xs tabular-nums">
        {showYear ? date : date.replace(/,? \d{4}$/, "")}
      </span>
    </PostLinkPreview>
  );
};

export default PostPreview;
