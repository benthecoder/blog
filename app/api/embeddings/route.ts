import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Fetching embeddings data for visualization...');

    // First, let's see how many total chunks we have
    const totalChunks = await sql`
      SELECT COUNT(*) as count FROM content_chunks WHERE embedding IS NOT NULL
    `;
    console.log(`Total chunks with embeddings: ${totalChunks.rows[0].count}`);

    // Count unique articles
    const uniqueArticles = await sql`
      SELECT COUNT(DISTINCT post_slug) as count FROM content_chunks WHERE embedding IS NOT NULL
    `;
    console.log(`Unique articles with embeddings: ${uniqueArticles.rows[0].count}`);

    // Simplified query - get one embedding per article
    const results = await sql`
      SELECT DISTINCT ON (post_slug)
        id,
        post_slug,
        post_title,
        content,
        chunk_type,
        metadata,
        sequence,
        embedding,
        created_at
      FROM content_chunks
      WHERE embedding IS NOT NULL
      ORDER BY 
        post_slug,
        CASE WHEN chunk_type = 'full-post' THEN 0 ELSE 1 END,
        sequence
    `;

    console.log(`Found ${results.rows.length} articles with embeddings`);

    // Helper function to parse embedding
    const parseEmbedding = (embedding: any): number[] => {
      if (Array.isArray(embedding)) {
        return embedding;
      }
      
      if (typeof embedding === 'string') {
        try {
          // Try to parse as JSON array
          const parsed = JSON.parse(embedding);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {
          // If not JSON, try to parse as PostgreSQL vector format
          // Remove brackets and split by comma
          const cleaned = embedding.replace(/[\[\]]/g, '');
          return cleaned.split(',').map(Number);
        }
      }
      
      console.warn('Could not parse embedding:', typeof embedding, embedding);
      return [];
    };

    // Process the data for visualization
    const processedData = results.rows.map((row, index) => {
      const parsedEmbedding = parseEmbedding(row.embedding);
      
      return {
        id: row.id,
        postSlug: row.post_slug,
        postTitle: row.post_title,
        content: row.content,
        chunkType: row.chunk_type,
        metadata: row.metadata,
        sequence: row.sequence,
        embedding: parsedEmbedding,
        publishedDate: row.metadata?.published_date,
        tags: row.metadata?.tags || [],
        createdAt: row.created_at,
        index: index
      };
    }).filter(item => item.embedding.length > 0); // Filter out items with invalid embeddings

    console.log(`Processed ${processedData.length} articles with valid embeddings`);

    return NextResponse.json({
      success: true,
      data: processedData,
      count: processedData.length,
      debug: {
        totalChunks: totalChunks.rows[0].count,
        uniqueArticles: uniqueArticles.rows[0].count,
        returnedArticles: processedData.length
      }
    });

  } catch (error) {
    console.error('Error fetching embeddings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch embeddings data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
