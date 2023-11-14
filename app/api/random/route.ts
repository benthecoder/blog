import { getAllPostSlugs } from '../../../scripts/postUtils';
import { NextResponse } from 'next/server';

export function GET(request: Request) {
  const slugs = getAllPostSlugs();
  const randomSlug = slugs[Math.floor(Math.random() * slugs.length)];

  return new NextResponse(JSON.stringify({ slug: randomSlug }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store', // Ensures no caching
    },
  });
}
