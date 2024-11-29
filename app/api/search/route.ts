import { sql } from '@vercel/postgres';
import { VoyageAIClient } from 'voyageai';
import { NextResponse } from 'next/server';

const client = new VoyageAIClient({
  apiKey: process.env.VOYAGE_AI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    console.log('Database URL:', !!process.env.DATABASE_URL); // Log if URL exists

    const { query } = await request.json();
    console.log('Received search query:', query);

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Generate embedding for the search query
    console.log('Generating embedding...');
    const queryEmbedding = await client.embed({
      model: 'voyage-3-lite',
      input: query,
      inputType: 'document',
    });

    if (!queryEmbedding?.data?.[0]?.embedding) {
      console.error('Failed to generate embedding:', queryEmbedding);
      return NextResponse.json(
        { error: 'Failed to generate embedding for query' },
        { status: 500 }
      );
    }

    const embedding = queryEmbedding.data[0].embedding;
    const formattedEmbedding = `[${embedding.join(',')}]`;

    // Perform hybrid search combining vector similarity and text search
    console.log('Executing hybrid search query...');
    const results = await sql`
      WITH RankedResults AS (
        SELECT 
          content,
          post_slug,
          post_title,
          chunk_type,
          metadata,
          1 - (embedding <=> ${formattedEmbedding}::vector) as vector_similarity,
          ts_rank(
            to_tsvector('english', content || ' ' || post_title),
            plainto_tsquery('english', ${query})
          ) as text_rank
        FROM content_chunks
        WHERE 
          -- Text search condition
          to_tsvector('english', content || ' ' || post_title) @@ plainto_tsquery('english', ${query})
          OR
          -- Vector similarity condition
          1 - (embedding <=> ${formattedEmbedding}::vector) > 0.5
      )
      SELECT 
        content,
        post_slug,
        post_title,
        chunk_type,
        metadata,
        vector_similarity,
        text_rank,
        -- Combine both scores with weights
        (vector_similarity * 0.7 + COALESCE(text_rank, 0) * 0.3) as hybrid_score
      FROM RankedResults
      ORDER BY hybrid_score DESC
      LIMIT 25;
    `;

    console.log(`Found ${results.rows.length} results`);

    // If no results, fall back to a more lenient search
    if (results.rows.length === 0) {
      console.log('No results, trying fallback hybrid search...');
      const fallbackResults = await sql`
        WITH RankedResults AS (
          SELECT 
            content,
            post_slug,
            post_title,
            chunk_type,
            metadata,
            1 - (embedding <=> ${formattedEmbedding}::vector) as vector_similarity,
            ts_rank(
              to_tsvector('english', content || ' ' || post_title),
              plainto_tsquery('english', ${query})
            ) as text_rank
          FROM content_chunks
        )
        SELECT 
          content,
          post_slug,
          post_title,
          chunk_type,
          metadata,
          vector_similarity,
          text_rank,
          (vector_similarity * 0.7 + COALESCE(text_rank, 0) * 0.3) as hybrid_score
        FROM RankedResults
        ORDER BY hybrid_score DESC
        LIMIT 15;
      `;

      return NextResponse.json({
        results: fallbackResults.rows.map((row) => ({
          ...row,
          similarity: row.hybrid_score,
        })),
        fallback: true,
      });
    }

    return NextResponse.json({
      results: results.rows.map((row) => ({
        ...row,
        similarity: row.hybrid_score,
      })),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}
