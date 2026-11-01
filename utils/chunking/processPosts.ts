import fs from "node:fs";
import { getPostPath } from "@/config/paths";
import { getAllPosts } from "../content/posts";
import { processMarkdownFile } from "./processMarkdownChunks";

export async function processAllPosts() {
  const postFiles = getAllPosts();
  const processedPosts = [];

  // A post that fails to parse stops the run: skipping it would rebuild the
  // index without that post.
  for (const filePath of postFiles) {
    processedPosts.push(await processMarkdownFile(filePath));
  }

  return processedPosts;
}

/** Read only the requested published post, before any index replacement. */
export async function processPost(input: string) {
  const slug = input.endsWith(".md") ? input.slice(0, -3) : input;
  const filePath = getPostPath(slug);
  if (!fs.existsSync(filePath)) throw new Error(`Post ${slug} not found`);
  const post = await processMarkdownFile(filePath);
  if (!post.chunks.some((chunk) => chunk.content.trim().length > 0)) {
    throw new Error(
      `Post ${slug} has no embeddable chunks; existing index preserved`
    );
  }
  return post;
}
