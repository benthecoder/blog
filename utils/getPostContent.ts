import matter from 'gray-matter';
import fs from 'fs';

const getPostContent = (slug: string) => {
  const folder = 'posts/';
  const file = `${folder}${slug}.md`;
  const content = fs.readFileSync(file, 'utf8');
  const matterResult = matter(content);
  // Remove the orig property (Uint8Array) which can't be serialized
  const { orig, ...serializableResult } = matterResult;
  return serializableResult;
};

export default getPostContent;
