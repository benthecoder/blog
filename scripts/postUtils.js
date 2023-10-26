import fs from 'fs';
import path from 'path';

export const getAllPostSlugs = () => {
  const postsDirectory = path.join(process.cwd(), 'posts');
  const filenames = fs.readdirSync(postsDirectory);
  const slugs = filenames.map((filename) => path.parse(filename).name);
  return slugs;
};
