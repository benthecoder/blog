import fs from "fs";
import { getPostPath, isSafeSlug } from "@/config/paths";
import { tryDecodeUrlComponent } from "@/utils/links/url";
import { getPostContent } from "./posts";

export interface PostPreviewData {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

const EXCERPT_WORDS = 40;
const deployedPreviews = new Map<string, PostPreviewData>();

/** Recognize internal post links without letting malformed escapes crash a page. */
export function postSlugFromHref(href: string): string | null {
  const match = href.match(/^(?:https?:\/\/bneo\.xyz)?\/posts\/([^/#?]+)$/);
  if (!match) return null;
  const slug = tryDecodeUrlComponent(match[1]);
  return isSafeSlug(slug) ? slug : null;
}

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
  if (!isSafeSlug(slug)) return null;
  const immutableDeployment =
    process.env.NODE_ENV === "production" && process.env.VERCEL === "1";
  if (immutableDeployment && deployedPreviews.has(slug))
    return deployedPreviews.get(slug)!;
  if (!fs.existsSync(getPostPath(slug))) return null;
  // Read just this published file. A cold preview must not parse the entire
  // archive merely to find its title and date.
  const post = getPostContent(slug);
  const words = stripMarkdown(post.content).split(" ");
  const excerpt =
    words.slice(0, EXCERPT_WORDS).join(" ") +
    (words.length > EXCERPT_WORDS ? " …" : "");

  const preview = {
    slug,
    title: post.data.title as string,
    date: post.data.date as string,
    excerpt,
  };
  if (immutableDeployment) deployedPreviews.set(slug, preview);
  return preview;
}
