import { getAllPosts } from "./getAllPosts";
import { processMarkdownFile } from "./processMarkdownChunks";

export async function processAllPosts() {
  const postFiles = getAllPosts();
  const processedPosts = [];

  for (const filePath of postFiles) {
    try {
      const processed = await processMarkdownFile(filePath);
      processedPosts.push(processed);
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  return processedPosts;
}
