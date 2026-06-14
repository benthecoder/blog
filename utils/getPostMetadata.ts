import path from "path";
import { POSTS_DIR } from "@/config/paths";
import { PostMetadata } from "@/types/post";
import { calculateWordCount } from "./postUtils";
import { scanMarkdownDir } from "./markdown";

const getPostMetadata = (
  options: { includeDrafts?: boolean } = {}
): PostMetadata[] => {
  const { includeDrafts = false } = options;

  const dirs = includeDrafts
    ? [POSTS_DIR, path.join(POSTS_DIR, "drafts")]
    : [POSTS_DIR];

  const posts: PostMetadata[] = dirs.flatMap((dir) =>
    scanMarkdownDir(dir).map(({ slug, data, content }) => ({
      title: data.title as string,
      date: data.date as string,
      tags: (data.tags as string) || "",
      wordcount: calculateWordCount(content),
      slug,
      isDraft: dir.includes("drafts"),
      prev: null,
      next: null,
    }))
  );

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  posts.forEach((post, i) => {
    post.prev = i < posts.length - 1 ? posts[i + 1] : null;
    post.next = i > 0 ? posts[i - 1] : null;
  });

  return posts;
};

export default getPostMetadata;
