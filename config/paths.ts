import path from "path";

export const ROOT_DIR = process.cwd();

export const POSTS_DIR = path.join(ROOT_DIR, "posts");
export const WIKI_DIR = path.join(ROOT_DIR, "wiki");

const PUBLIC_DIR = path.join(ROOT_DIR, "public");
export const IMAGES_DIR = path.join(PUBLIC_DIR, "images");

export const LIBRARY_MD = path.join(ROOT_DIR, "app/library/library.md");
export const PROJECTS_MD = path.join(ROOT_DIR, "app/projects/projects.md");

export function getPostPath(slug: string): string {
  return path.join(POSTS_DIR, `${slug}.md`);
}

export function getWikiPath(slug: string): string {
  return path.join(WIKI_DIR, `${slug}.md`);
}
