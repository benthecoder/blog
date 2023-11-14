import { getAllPostSlugs } from '../../../scripts/postUtils';

export function GET(request: Request) {
  const slugs = getAllPostSlugs();
  const randomSlug = slugs[Math.floor(Math.random() * slugs.length)];
  return Response.json({ slug: randomSlug });
}
