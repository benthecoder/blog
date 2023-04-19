import type { NextApiRequest, NextApiResponse } from 'next';
import { queryBuilder } from '../../lib/planetscale';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    await queryBuilder
      .insertInto('tweets')
      .values({
        content: (req.body.body || '').slice(0, 500),
      })
      .execute();

    return res.status(200).json({ error: null });
  }

  if (req.method === 'DELETE') {
    await queryBuilder
      .deleteFrom('tweets')
      .where('id', '=', req.body.id)
      .execute();

    return res.status(204).json({});
  }

  return res.send('Method not allowed.');
}
