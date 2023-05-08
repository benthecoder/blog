import fs from 'fs';
import matter from 'gray-matter';
import { PostMetadata } from '../components/PostMetadata';

const getPostMetadata = (): PostMetadata[] => {
  const folder = 'posts/';
  const files = fs.readdirSync(folder);
  const markdownPosts = files.filter((file) => file.endsWith('.md'));

  const posts = markdownPosts.map((fileName) => {
    const fileContents = fs.readFileSync(`posts/${fileName}`, 'utf8');
    const matterResult = matter(fileContents);

    return {
      title: matterResult.data.title,
      date: matterResult.data.date,
      tags: matterResult.data.tags,
      wordcount: (matterResult.content.match(/\b\w+\b/gu) || []).length,
      slug: fileName.replace('.md', ''),
    };
  });

  // Sort posts by date.
  posts.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });

  return posts;
};

export default getPostMetadata;
