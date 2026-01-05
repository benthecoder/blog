/**
 * Post utilities for frontmatter parsing and metadata extraction
 * Consolidates post-related logic across the application
 */

import matter from "gray-matter";
import fs from "fs";
import path from "path";
import { PostFrontmatter } from "@/types/post";

/**
 * Parse frontmatter from markdown content
 *
 * @param content - Markdown content string
 * @returns Parsed frontmatter and content
 */
export function parseFrontmatter(content: string) {
  return matter(content);
}

/**
 * Read and parse frontmatter from a markdown file
 *
 * @param filePath - Path to markdown file
 * @returns Parsed frontmatter and content
 */
export function readPostFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf8");
  return parseFrontmatter(content);
}

/**
 * Extract tags from frontmatter as an array
 * Handles both string and array tag formats
 *
 * @param frontmatter - Frontmatter object
 * @returns Array of tags
 */
export function extractTags(frontmatter: PostFrontmatter): string[] {
  const tagValue = frontmatter?.tags;

  if (!tagValue) {
    return [];
  }

  if (Array.isArray(tagValue)) {
    return tagValue;
  }

  if (typeof tagValue === "string") {
    return tagValue.split(",").map((tag: string) => tag.trim());
  }

  return [];
}

/**
 * Calculate word count from content, excluding block quotes
 *
 * @param content - Text content
 * @returns Number of words
 */
export function calculateWordCount(content: string): number {
  // Remove block quote lines (lines starting with >)
  const contentWithoutBlockQuotes = content
    .split("\n")
    .filter((line) => !line.trim().startsWith(">"))
    .join("\n");

  return (contentWithoutBlockQuotes.match(/\b\w+\b/gu) || []).length;
}

/**
 * Extract slug from file path
 *
 * @param filePath - Path to markdown file
 * @returns Slug (filename without extension)
 */
export function extractSlug(filePath: string): string {
  return path.basename(filePath, ".md");
}

/**
 * Check if a post is a draft based on its path
 *
 * @param filePath - Path to markdown file
 * @returns True if the post is a draft
 */
export function isDraft(filePath: string): boolean {
  return filePath.includes("/drafts/");
}
