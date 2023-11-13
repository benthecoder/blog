// scripts/rss.mjs
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';

const generateRss = async () => {
  const POSTS_DIR = path.join(process.cwd(), 'posts');
  const posts = fs
    .readdirSync(POSTS_DIR)
    .filter(
      (filePath) =>
        !fs.statSync(path.join(POSTS_DIR, filePath)).isDirectory() &&
        filePath !== '.DS_Store'
    ) // ignore directories and .DS_Store
    .map((filePath) => {
      const source = fs.readFileSync(path.join(POSTS_DIR, filePath));
      const { content, data } = matter(source);

      return {
        content,
        data,
        filePath,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
    );

  fs.writeFileSync('app/api/rss/feed.json', JSON.stringify(posts));
};

generateRss();
