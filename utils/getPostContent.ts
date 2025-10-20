import matter from "gray-matter";
import fs from "fs";

// Import shared utilities
import { getPostPath } from "@/config/paths";

const getPostContent = (slug: string) => {
  const file = getPostPath(slug);
  const content = fs.readFileSync(file, "utf8");
  const matterResult = matter(content);
  // Remove the orig property (Uint8Array) which can't be serialized
  const { orig, ...serializableResult } = matterResult;
  return serializableResult;
};

export default getPostContent;
