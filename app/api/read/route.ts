// app/api/read.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

async function fetchHtml(url: string): Promise<string> {
  const response = await axios.get(url);
  return response.data;
}

async function extractContent(html: string): Promise<string> {
  const dom = new JSDOM(html);
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) {
    throw new Error('Error extracting content from the HTML.');
  }

  return article.textContent;
}

export async function POST(request: NextRequest) {
  if (!request.body) {
    return new NextResponse('Body is missing', { status: 400 });
  }

  const { url } = await request.json();

  try {
    const html = await fetchHtml(url);
    const content = await extractContent(html);
    return new NextResponse(JSON.stringify({ text: content }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
