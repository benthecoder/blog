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
    const postItems = feed
      .map((page: BlogPost) => {
        const url = `${
          process.env.NEXT_PUBLIC_ROOT_URL
        }/posts/${page.filePath.replace('.md', '')}`;
        const contentHTML = marked(page.content); // Assumes marked does not encode HTML entities
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
    <rss version="2.0">
      <channel>
      <title>${metadata.title}</title>
      <description>${metadata.description}</description>
      <link>${metadata.link}</link>
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
