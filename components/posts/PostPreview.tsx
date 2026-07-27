import { PostMetadata } from "@/types/post";
import PostLinkPreview from "./PostLinkPreview";

const PostPreview = (props: PostMetadata) => {
  return (
    <PostLinkPreview
      slug={props.slug}
      className="group relative flex justify-between items-center cursor-crosshair text-sm md:text-base"
    >
      <p className="text-ink dark:text-chalk group-hover:underline">
        {props.title}
      </p>
      <p className="text-ink-muted dark:text-chalk-muted shrink-0 ml-4">
        {props.date}
      </p>
    </PostLinkPreview>
  );
};

export default PostPreview;
