import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import sanitizeHtml from "sanitize-html";
import { SITE_URL } from "@/config/site";
import type { PostMetadata } from "@/types/post";

export const RSS_POST_LIMIT = 50;
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify);

// Split CDATA terminators so an article containing XML examples cannot break the feed.
function cdata(value: string) {
  return `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

interface FeedOptions {
  title?: string;
  description?: string;
  basePath?: string; // item URLs: SITE_URL + basePath + slug
  selfPath?: string; // the feed's own URL path
}

export function buildRssFeed(
  posts: Pick<PostMetadata, "slug" | "title" | "date">[],
  readContent: (slug: string) => string,
  {
    title = "Benedict Neo",
    description = "Daily writing about learnings, thoughts, and ideas",
    basePath = "/posts/",
    selfPath = "/rss.xml",
  }: FeedOptions = {}
): string {
  const recent = posts.slice(0, RSS_POST_LIMIT);
  const items = recent
    .map((post) => {
      const url = `${SITE_URL}${basePath}${encodeURIComponent(post.slug)}`;
      const html = String(
        processor.processSync(readContent(post.slug))
      ).replace(/src="\/images\//g, `src="${SITE_URL}/images/`);
      const summary = sanitizeHtml(html, {
        allowedTags: [],
        allowedAttributes: {},
      })
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 240);
      return `<item>
<title>${cdata(post.title)}</title>
<link>${url}</link><guid>${url}</guid>
<pubDate>${new Date(post.date).toUTCString()}</pubDate>
<description>${cdata(summary)}</description>
<content:encoded>${cdata(html)}</content:encoded>
</item>`;
    })
    .join("\n");
  const date = recent[0]
    ? `<lastBuildDate>${new Date(recent[0].date).toUTCString()}</lastBuildDate>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel><title>${title}</title>
<description>${description}</description>
<link>${SITE_URL}</link><atom:link href="${SITE_URL}${selfPath}" rel="self" type="application/rss+xml" />
${date}${items}</channel></rss>`;
}
