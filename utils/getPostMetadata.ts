import * as fs from 'fs';

import matter from 'gray-matter';
import { PostMetadata } from '../components/PostMetadata';

const getPostMetadata = (getDrafts: boolean = false): PostMetadata[] => {
  const folder = getDrafts ? 'posts/drafts/' : 'posts/';
  ('posts/');
  const files = fs.readdirSync(folder);
  const markdownPosts = files.filter((file) => file.endsWith('.md'));

  const posts: PostMetadata[] = markdownPosts.map(
    (fileName): Partial<PostMetadata> => {
      try {
        const fileContents = fs.readFileSync(`${folder}${fileName}`, 'utf8');
        const matterResult = matter(fileContents);

        return {
          title: matterResult.data.title,
          date: matterResult.data.date,
          tags: matterResult.data.tags,
          wordcount: (matterResult.content.match(/\b\w+\b/gu) || []).length,
          slug: fileName.replace('.md', ''),
        };
      } catch (error) {
        console.error(`Error parsing frontmatter in file: ${fileName}`);
        console.error(error);
        // Return a minimal object to prevent the entire function from failing
        return {
          title: `Error in ${fileName}`,
          slug: fileName.replace('.md', ''),
        };
      }
    }
  ) as PostMetadata[];

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
