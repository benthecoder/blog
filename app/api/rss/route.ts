import { NextRequest, NextResponse } from 'next/server';
import feed from './feed.json';
import { marked } from 'marked';

type BlogPost = any;

const metadata = {
  title: 'Benedict Neo',
  description: 'Daily writing about learnings, thoughts, and ideas',
  link: 'https://bneo.xyz',
};

const escapeXml = (unsafe: string) =>
  unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return '';
    }
  });

export async function GET(req: NextRequest) {
  try {
    const rootUrl = process.env.NEXT_PUBLIC_ROOT_URL;
    const feedPath = '/rss.xml'; // Correct path to your feed
    const feedUrl = `${rootUrl}${feedPath}`; // The full URL to your feed

    const postItems = feed
      .map((page: BlogPost) => {
        const url = `${rootUrl}/posts/${page.filePath.replace('.md', '')}`;
        let contentHTML = marked(page.content); // Assumes marked does not encode HTML entities

        // Convert relative URLs to absolute URLs
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
      </item>`;
      })
      .join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>${metadata.title}</title>
        <description>${metadata.description}</description>
        <link>${rootUrl}</link>
        <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
        <lastBuildDate>${new Date(
          feed[0].data.date
        ).toUTCString()}</lastBuildDate>
        ${postItems}
      </channel>
    </rss>`;

    const res = new NextResponse(sitemap, {
      headers: { 'Content-Type': 'text/xml' },
    });

    return res;
  } catch (e) {
    return new NextResponse(null, {
      status: 500,
      statusText: 'Internal Server Error',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
