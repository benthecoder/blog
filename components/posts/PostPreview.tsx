import Link from "next/link";
import { PostMetadata } from "@/types/post";

const PostPreview = (props: PostMetadata) => {
  return (
    <Link
      href={`/posts/${props.slug}`}
      className="group relative flex justify-between items-center cursor-crosshair text-sm md:text-base"
    >
      <p className="text-japanese-sumiiro dark:text-japanese-shironezu">
        {props.title}
      </p>
      <p className="text-japanese-nezumiiro dark:text-japanese-ginnezu shrink-0 ml-4">
        {props.date}
      </p>
    </Link>
  );
};

export default PostPreview;
