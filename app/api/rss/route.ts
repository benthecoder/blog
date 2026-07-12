import { NextResponse } from "next/server";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { getPostMetadata, getPostContent } from "@/utils/content/posts";
import { SITE_URL } from "@/config/site";

export const dynamic = "force-static";

const siteMetadata = {
  title: "Benedict Neo",
  description: "Daily writing about learnings, thoughts, and ideas",
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify);

export async function GET() {
  try {
    const rootUrl = SITE_URL;
    const feedUrl = `${rootUrl}/rss.xml`;
    const posts = getPostMetadata();

    const postItems = posts
      .map((post) => {
        const url = `${rootUrl}/posts/${post.slug}`;
        const { content } = getPostContent(post.slug);
        const contentHTML = String(processor.processSync(content)).replace(
          /src="\/images\//g,
          `src="${rootUrl}/images/`
        );
        const pubDate = new Date(post.date).toUTCString();

        return `<item>
        <title><![CDATA[${post.title}]]></title>
        <link>${url}</link>
        <guid>${url}</guid>
        <pubDate>${pubDate}</pubDate>
        <description><![CDATA[${contentHTML}]]></description>
        <content:encoded><![CDATA[${contentHTML}]]></content:encoded>
      </item>`;
      })
      .join("");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0"
        xmlns:content="http://purl.org/rss/1.0/modules/content/"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:atom="http://www.w3.org/2005/Atom">
        <channel>
        <title>${siteMetadata.title}</title>
        <description>${siteMetadata.description}</description>
        <link>${rootUrl}</link>
        <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
        <lastBuildDate>${new Date(posts[0].date).toUTCString()}</lastBuildDate>
        ${postItems}
      </channel>
    </rss>`;

    return new NextResponse(rss, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch {
    return new NextResponse(null, {
      status: 500,
      statusText: "Internal Server Error",
      headers: { "Content-Type": "text/plain" },
    });
  }
}
