import * as fs from "fs";
import path from "path";
import matter from "gray-matter";

// Import shared utilities and types
import { POSTS_DIR } from "@/config/paths";
import { PostMetadata } from "@/types/post";
import { calculateWordCount } from "./postUtils";

const getPostMetadata = (
  options: { includeDrafts?: boolean } = {}
): PostMetadata[] => {
  const { includeDrafts = false } = options;

  const folders = includeDrafts
    ? [POSTS_DIR, path.join(POSTS_DIR, "drafts")]
    : [POSTS_DIR];

  const posts: PostMetadata[] = [];

  for (const folder of folders) {
    if (!fs.existsSync(folder)) continue;

    const files = fs.readdirSync(folder);
    const markdownPosts = files.filter((file) => file.endsWith(".md"));

    const folderPosts = markdownPosts.map((fileName): Partial<PostMetadata> => {
      try {
        const fileContents = fs.readFileSync(
          path.join(folder, fileName),
          "utf8"
        );
        const matterResult = matter(fileContents);

        return {
          title: matterResult.data.title,
          date: matterResult.data.date,
          tags: matterResult.data.tags || "",
          wordcount: calculateWordCount(matterResult.content),
          slug: fileName.replace(".md", ""),
          isDraft: folder.includes("drafts"),
        };
      } catch (error) {
        console.error(`Error parsing frontmatter in file: ${fileName}`);
        console.error(error);
        return {
          title: `Error in ${fileName}`,
          slug: fileName.replace(".md", ""),
          isDraft: folder.includes("drafts"),
        };
      }
    }) as PostMetadata[];

    posts.push(...folderPosts);
  }

  // Sort posts by date.
  posts.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    if (dateA < dateB) {
      return 1;
    } else {
      return -1;
    }
  });

  posts.forEach((post, index) => {
    post.next = index > 0 ? posts[index - 1] : null;
    post.prev = index < posts.length - 1 ? posts[index + 1] : null;
  });

  return posts;
};

export default getPostMetadata;
