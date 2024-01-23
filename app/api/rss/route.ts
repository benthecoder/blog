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
        const contentHTML = marked.parse(page.content, {
          headerIds: false,
          mangle: false,
        });

        return `<item>
        <title><![CDATA[${escapeXml(page.data.title)}]]></title>
        <link>${url}</link>
        <guid>${url}</guid>
        <pubDate>${page.data.date}</pubDate>
        <description><![CDATA[${escapeXml(contentHTML)}]]></description>
      </item>`;
      })
      .join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
      <channel>
      <title>${metadata.title}</title>
      <description>${metadata.description}</description>
      <link>${metadata.link}</link>
      <lastBuildDate>${feed[0].data.date}</lastBuildDate>
      ${postItems}
      </channel>
      </rss>`;

    const res = new NextResponse(sitemap);
    res.headers.set('Content-Type', 'text/xml');

    return res;
  } catch (e: unknown) {
    if (!(e instanceof Error)) {
      throw e;
    }

    return NextResponse.json({ error: e.message || '' }, { status: 500 });
  }
}
