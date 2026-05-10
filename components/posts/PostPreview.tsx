import Link from "next/link";
import { PostMetadata } from "@/types/post";

const PostPreview = (props: PostMetadata) => {
  return (
    <Link href={`/posts/${props.slug}`}>
      <div className="group relative flex justify-between items-center cursor-crosshair text-sm md:text-md">
        <div className="flex items-center gap-1">
          <p className="text-japanese-sumiiro dark:text-japanese-shironezu">
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
