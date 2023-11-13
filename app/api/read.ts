import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

async function fetchHtml(url: string): Promise<string> {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error('Error fetching HTML from the provided URL.');
  }
}

async function extractContent(html: string): Promise<string> {
  const dom = new JSDOM(html);
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) {
    throw new Error('Error extracting content from the HTML.');
  }

  return article.textContent; // Return textContent instead of content
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const { url } = req.body;

  try {
    const html = await fetchHtml(url);
    const content = await extractContent(html);
    res.status(200).json({ text: content });
  } catch (error) {
    console.error(error);
  }
};
