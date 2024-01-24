import { NextResponse } from 'next/server';
import { neon, neonConfig } from '@neondatabase/serverless';
import { z } from 'zod';
import { generateEmbedding } from '../../../utils';

neonConfig.fetchConnectionCache = true;
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    console.log('Received search request');
    const sql = neon(process.env.NEON_DATABASE_URL!);
    console.log('NEON Database URL:', process.env.NEON_DATABASE_URL);

    const body = await request.json();
    console.log('Request body:', body);

    const schema = z.object({
      query: z.string().min(4, 'Query must be at least 4 character long.'),
    });

    const validated = schema.safeParse(body);
    if (!validated.success) {
      console.error('Validation failed:', validated.error.message);
      return NextResponse.json(
        {
          error: `Invalid request: ${validated.error.message}`,
        },
        { status: 400 }
      );
    }

    const { query } = validated.data;
    console.log('Search query:', query);
    const embedding = await generateEmbedding(query);
    console.log('Generated embedding:', embedding);

    const sqlQuery = `
      SELECT title, slug, date, tags, wordcount, content
      FROM blog_posts
      ORDER BY embedding::VECTOR <=> '[${embedding}]'
      LIMIT 15;
    `;

    const result = await sql(sqlQuery);
    console.log('SQL query result:', result);
    return NextResponse.json({ data: result });
  } catch (e: unknown) {
    if (!(e instanceof Error)) {
      throw e;
    }
    console.error('Error in POST function:', e.message);
    return NextResponse.json({ error: e.message || '' }, { status: 500 });
  }
}
