import { getAllPostSlugs } from '../../scripts/postUtils';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const slugs = getAllPostSlugs();
  const randomSlug = slugs[Math.floor(Math.random() * slugs.length)];
  res.status(200).json({ slug: randomSlug });
}
