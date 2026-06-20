import path from "path";

export const ROOT_DIR = process.cwd();

export const POSTS_DIR = path.join(ROOT_DIR, "posts");
export const DRAFTS_DIR = path.join(POSTS_DIR, "drafts");
export const WIKI_DIR = path.join(ROOT_DIR, "wiki");

const PUBLIC_DIR = path.join(ROOT_DIR, "public");
export const IMAGES_DIR = path.join(PUBLIC_DIR, "images");
export const IMAGES_DRAFTS_DIR = path.join(IMAGES_DIR, "drafts");
export const DATA_DIR = path.join(PUBLIC_DIR, "data");

export const LIBRARY_MD = path.join(ROOT_DIR, "app/library/library.md");
export const PROJECTS_MD = path.join(ROOT_DIR, "app/projects/projects.md");

export function getPostPath(slug: string): string {
  return path.join(POSTS_DIR, `${slug}.md`);
}

export function getDraftPath(slug: string): string {
  return path.join(DRAFTS_DIR, `${slug}.md`);
}

export function getWikiPath(slug: string): string {
  return path.join(WIKI_DIR, `${slug}.md`);
}

/**
 * Guard against path traversal for any user-supplied slug or filename used to
 * build a filesystem path. Rejects directory separators and `..` segments.
 */
export function isSafeSlug(value: string): boolean {
  return (
    !value.includes("..") &&
    !value.includes("/") &&
    !value.includes("\\") &&
    !value.includes("\0")
  );
}
