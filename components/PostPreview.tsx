import Link from "next/link";
import { PostMetadata } from "@/types/post";

const PostPreview = (props: PostMetadata) => {
  const isStarred = props.tags.includes("✰");

  return (
    <Link href={`/posts/${props.slug}`}>
      <div className="group relative flex justify-between items-center hover:bg-japanese-unoharairo dark:hover:bg-japanese-sumiiro/30 cursor-crosshair text-xs md:text-sm">
        {/* Title and optional star */}
        <div className="flex items-center gap-1">
          {isStarred && (
            <span className="text-light-accent dark:text-dark-accent">✰</span>
          )}
          <p
            className={`${
              isStarred
                ? "font-medium text-light-accent dark:text-dark-accent"
                : "text-japanese-sumiiro dark:text-japanese-shironezu"
            }`}
          >
            {props.title}
          </p>
        </div>

        {/* Date */}
        <p className="text-japanese-nezumiiro dark:text-japanese-ginnezu">
          {props.date}
        </p>
      </div>
    </Link>
  );
};

export default PostPreview;
