import {
  ESSAYS_DIR,
  ESSAY_DRAFTS_DIR,
  DRAFTS_DIR,
  POSTS_DIR,
  getDraftPath,
  getEssayDraftPath,
  getEssayPath,
  getPostPath,
} from "@/config/paths";

export type ContentKind = "post" | "essay";

/** Absent means "post"; anything unrecognised is rejected (null). */
export function parseKind(value: unknown): ContentKind | null {
  if (value === undefined || value === null || value === "") return "post";
  return value === "post" || value === "essay" ? value : null;
}

/** Where each kind keeps its drafts and published files. */
export function contentPaths(kind: ContentKind) {
  return kind === "essay"
    ? {
        draftsDir: ESSAY_DRAFTS_DIR,
        publishedDir: ESSAYS_DIR,
        draftPath: getEssayDraftPath,
        publishedPath: getEssayPath,
      }
    : {
        draftsDir: DRAFTS_DIR,
        publishedDir: POSTS_DIR,
        draftPath: getDraftPath,
        publishedPath: getPostPath,
      };
}
