import { NextResponse } from 'next/server';
import { neon, neonConfig } from '@neondatabase/serverless';
import { z } from 'zod';
import { generateEmbedding } from '../../../utils';

neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.NEON_DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const schema = z.object({
      query: z.string().min(1, 'Query must be at least 5 character long.'),
    });

    const validated = schema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: `Invalid request: ${validated.error.message}`,
        },
        { status: 400 }
      );
    }

    const { query } = validated.data;
    const embedding = await generateEmbedding(query);

    const sqlQuery = `
      SELECT title, slug, date, tags, wordcount, content
      FROM blog_posts
      ORDER BY embedding::VECTOR <=> '[${embedding}]'
      LIMIT 15;
    `;

    const result = await sql(sqlQuery);
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error searching blog posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
