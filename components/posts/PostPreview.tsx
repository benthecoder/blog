import { PostMetadata } from "@/types/post";
import PostLinkPreview from "./PostLinkPreview";

const PostPreview = (props: PostMetadata) => {
  return (
    <PostLinkPreview
      slug={props.slug}
      className="group relative flex justify-between items-center cursor-crosshair text-sm md:text-base"
    >
      <p className="text-japanese-sumiiro dark:text-japanese-shironezu group-hover:underline">
        {props.title}
      </p>
      <p className="text-japanese-nezumiiro dark:text-japanese-ginnezu shrink-0 ml-4">
        {props.date}
      </p>
    </PostLinkPreview>
  );
};

export default PostPreview;
