// Source: https://jonbellah.com/articles/rss-feed-nextjs

import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import feed from './feed.json';
import { marked } from 'marked';

type BlogPost = any;

const router = createRouter<NextApiRequest, NextApiResponse>();

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

/**
 * Respond with an rss.xml
 *
 * @param {object} req NextApiRequest
 * @param {object} res NextApiResponse
 */
router.get(async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const postItems = feed
      .map((page: BlogPost) => {
        const url = `${
          process.env.NEXT_PUBLIC_ROOT_URL
        }/posts/${page.filePath.replace('.md', '')}`;
        const contentHTML = marked.parse(page.content);

        return `<item>
        <title><![CDATA[${escapeXml(page.data.title)}]]></title>
        <link>${url}</link>
        <guid>${url}</guid>
        <pubDate>${page.data.date}</pubDate>
        <description><![CDATA[${escapeXml(contentHTML)}]]></description>
      </item>`;
      })
      .join('');

    // Add urlSet to entire sitemap string
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

    // set response content header to xml
    res.setHeader('Content-Type', 'text/xml');

    return res.status(200).send(sitemap);
  } catch (e: unknown) {
    if (!(e instanceof Error)) {
      throw e;
    }

    return res.status(500).json({ error: e.message || '' });
  }
});

export default router.handler({
  onError: (err, req, res) => {
    if (err instanceof Error) {
      console.error(err.stack);
      res.status(500).end(err.message);
    } else {
      console.error('An error occurred');
      res.status(500).end('An error occurred');
    }
  },
});
