import path from "path";

/**
 * Centralized path configuration for the application
 * All directory paths should be referenced from here
 */

/** Root directory of the project */
export const ROOT_DIR = process.cwd();

/** Posts directory containing markdown blog posts */
export const POSTS_DIR = path.join(ROOT_DIR, "posts");

/** Drafts directory containing unpublished posts */
export const DRAFTS_DIR = path.join(POSTS_DIR, "drafts");

/** Public directory for static assets */
export const PUBLIC_DIR = path.join(ROOT_DIR, "public");

/** Images directory */
export const IMAGES_DIR = path.join(PUBLIC_DIR, "images");

/**
 * Get the full path to a post file
 * @param slug - The post slug (without .md extension)
 * @returns Full path to the post file
 */
export function getPostPath(slug: string): string {
  return path.join(POSTS_DIR, `${slug}.md`);
}

/**
 * Get the full path to a draft file
 * @param slug - The draft slug (without .md extension)
 * @returns Full path to the draft file
 */
export function getDraftPath(slug: string): string {
  return path.join(DRAFTS_DIR, `${slug}.md`);
}
