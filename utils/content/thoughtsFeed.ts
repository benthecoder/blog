import { SITE_URL } from "@/config/site";
import type { Thought } from "@/types/thoughts";
import { cdata } from "./rss";

const THOUGHTS_FEED_LIMIT = 30;
const TITLE_MAX = 80;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function thoughtTitle(thought: Thought) {
  const line = thought.content.replace(/\s+/g, " ").trim();
  const text = line || thought.link_title || thought.link || "thought";
  if (text.length <= TITLE_MAX) return text;
  const cut = text.slice(0, TITLE_MAX);
  const space = cut.lastIndexOf(" ");
  return `${(space > 0 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

function thoughtHtml(thought: Thought) {
  const paragraphs = thought.content
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p.trim()).replaceAll("\n", "<br>")}</p>`);
  if (thought.link) {
    const href = escapeHtml(thought.link);
    const text = escapeHtml(thought.link_title ?? thought.link);
    paragraphs.push(`<p><a href="${href}">${text}</a></p>`);
  }
  return paragraphs.join("");
}

export function buildThoughtsFeed(thoughts: Thought[]): string {
  const recent = thoughts.slice(0, THOUGHTS_FEED_LIMIT);
  const items = recent
    .map((thought) => {
      const url = `${SITE_URL}/thoughts#t-${thought.id}`;
      return `<item>
<title>${cdata(thoughtTitle(thought))}</title>
<link>${url}</link><guid isPermaLink="true">${url}</guid>
<pubDate>${new Date(thought.created_at).toUTCString()}</pubDate>
<description>${cdata(thoughtHtml(thought))}</description>
</item>`;
    })
    .join("\n");
  const date = recent[0]
    ? `<lastBuildDate>${new Date(recent[0].created_at).toUTCString()}</lastBuildDate>\n`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel><title>Benedict Neo — thoughts</title>
<description>unfiltered thoughts, stream of consciousness</description>
<language>en</language>
<link>${SITE_URL}/thoughts</link><atom:link href="${SITE_URL}/thoughts/rss.xml" rel="self" type="application/rss+xml" />
${date}${items}</channel></rss>`;
}
