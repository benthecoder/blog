import path from "path";

const ROOT_DIR = process.cwd();

export const POSTS_DIR = path.join(ROOT_DIR, "posts");
export const DRAFTS_DIR = path.join(POSTS_DIR, "drafts");
export const WIKI_DIR = path.join(ROOT_DIR, "wiki");
export const ESSAYS_DIR = path.join(ROOT_DIR, "essays");
export const ESSAY_DRAFTS_DIR = path.join(ESSAYS_DIR, "drafts");

// Local-only helper + cache for the admin "photos from this day" panel.
export const PHOTOKIT_BIN = path.join(ROOT_DIR, ".cache", "bin", "photokit");
// Local-only macOS Dictionary helper for the editor's word lookup.
export const DEFINE_BIN = path.join(ROOT_DIR, ".cache", "bin", "define");
export const DEFINE_SRC = path.join(
  ROOT_DIR,
  "scripts",
  "define",
  "define.swift"
);
export const PHOTO_THUMBS_DIR = path.join(
  ROOT_DIR,
  ".cache",
  "photos",
  "thumbs"
);
export const PHOTO_FULL_DIR = path.join(ROOT_DIR, ".cache", "photos", "full");

const PUBLIC_DIR = path.join(ROOT_DIR, "public");
export const IMAGES_DIR = path.join(PUBLIC_DIR, "images");
export const IMAGES_DRAFTS_DIR = path.join(IMAGES_DIR, "drafts");
export const DATA_DIR = path.join(PUBLIC_DIR, "data");
export const KNOWLEDGE_MAP_JSON = path.join(DATA_DIR, "knowledge-map.json");
export const KNOWLEDGE_MAP_NODES_JSON = path.join(
  DATA_DIR,
  "knowledge-map-nodes.json"
);
export const IMAGE_META_JSON = path.join(DATA_DIR, "image-meta.json");

export const LIBRARY_MD = path.join(
  ROOT_DIR,
  "app/(sidebar)/library/library.md"
);
export const PROJECTS_MD = path.join(
  ROOT_DIR,
  "app/(sidebar)/projects/projects.md"
);

export function getPostPath(slug: string): string {
  return getMarkdownPath(POSTS_DIR, slug);
}

export function getDraftPath(slug: string): string {
  return getMarkdownPath(DRAFTS_DIR, slug);
}

export function getWikiPath(slug: string): string {
  return getMarkdownPath(WIKI_DIR, slug);
}

export function getEssayPath(slug: string): string {
  return getMarkdownPath(ESSAYS_DIR, slug);
}

export function getEssayDraftPath(slug: string): string {
  return getMarkdownPath(ESSAY_DRAFTS_DIR, slug);
}

function getMarkdownPath(directory: string, slug: string): string {
  if (!isSafeSlug(slug)) throw new Error("Invalid slug");
  const root = path.resolve(directory);
  const filePath = path.resolve(root, `${slug}.md`);
  // Check the normalized path itself before returning it to filesystem callers.
  // Include the separator so a sibling directory with the same prefix is rejected.
  if (!filePath.startsWith(root + path.sep)) {
    throw new Error("Path outside content directory");
  }
  if (path.dirname(filePath) !== path.resolve(directory)) {
    throw new Error("Path outside content directory");
  }
  return filePath;
}

/**
 * Guard against path traversal for any user-supplied slug or filename used to
 * build a filesystem path. Rejects directory separators and `..` segments.
 */
export function isSafeSlug(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.includes("..") &&
    !value.includes("/") &&
    !value.includes("\\") &&
    !value.includes("\0")
  );
}
