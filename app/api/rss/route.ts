import { NextResponse } from "next/server";
import feed from "./feed.json";
import { marked } from "marked";

marked.use({ mangle: false, headerIds: false });

export const dynamic = "force-static";

const siteMetadata = {
  title: "Benedict Neo",
  description: "Daily writing about learnings, thoughts, and ideas",
};

export async function GET() {
  try {
    const rootUrl = process.env.NEXT_PUBLIC_ROOT_URL;
    const feedUrl = `${rootUrl}/rss.xml`;

    const postItems = feed
      .map(
        (page: {
          data: { title: string; date: string };
          content: string;
          filePath: string;
        }) => {
          const url = `${rootUrl}/posts/${page.filePath.replace(".md", "")}`;
          let contentHTML = marked(page.content) as string;

          contentHTML = contentHTML.replace(
            /src="\/images\//g,
            `src="${rootUrl}/images/`
          );

          const pubDate = new Date(page.data.date).toUTCString();

          return `<item>
        <title><![CDATA[${page.data.title}]]></title>
        <link>${url}</link>
        <guid>${url}</guid>
        <pubDate>${pubDate}</pubDate>
        <description><![CDATA[${contentHTML}]]></description>
        <content:encoded><![CDATA[${contentHTML}]]></content:encoded>
      </item>`;
        }
      )
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
        <lastBuildDate>${new Date(feed[0].data.date).toUTCString()}</lastBuildDate>
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
