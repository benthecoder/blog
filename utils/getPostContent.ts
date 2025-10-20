import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';

const getPostContent = (slug: string) => {
  const file = path.join(process.cwd(), 'posts', `${slug}.md`);
  const content = fs.readFileSync(file, 'utf8');
  const matterResult = matter(content);
  // Remove the orig property (Uint8Array) which can't be serialized
  const { orig, ...serializableResult } = matterResult;
  return serializableResult;
};

export default getPostContent;
