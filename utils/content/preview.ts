import fs from "fs";
import { getPostPath } from "@/config/paths";
import { getPostContent, getPostMetadata } from "./posts";

export interface PostPreviewData {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

const EXCERPT_WORDS = 40;

/** Rough markdown → plain text, good enough for a short excerpt. */
function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Preview card data for an internal /posts/<slug> link, or null. */
export function getPostPreviewData(slug: string): PostPreviewData | null {
  if (!fs.existsSync(getPostPath(slug))) return null;

  const post = getPostMetadata().find((p) => p.slug === slug);
  if (!post) return null;

  const words = stripMarkdown(getPostContent(slug).content).split(" ");
  const excerpt =
    words.slice(0, EXCERPT_WORDS).join(" ") +
    (words.length > EXCERPT_WORDS ? " …" : "");

  return { slug, title: post.title, date: post.date, excerpt };
}
