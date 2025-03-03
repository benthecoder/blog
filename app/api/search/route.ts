import { sql } from '@vercel/postgres';
import { VoyageAIClient } from 'voyageai';
import { NextResponse } from 'next/server';

const client = new VoyageAIClient({
  apiKey: process.env.VOYAGE_AI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    console.log('Database URL:', !!process.env.DATABASE_URL);

    const { query, searchType = 'hybrid' } = await request.json();
    console.log('Received search query:', query, 'Search type:', searchType);

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }
    
    // Helper function to safely prepare query for PostgreSQL ts_query
    const prepareSearchQuery = (input: string, operator: string = '&'): string => {
      try {
        // Remove any special characters that could break the tsquery
        const sanitized = input.replace(/['&|!():*]/g, ' ').trim();
        
        if (!sanitized) return '';
        
        // Split by whitespace and filter out empty strings
        const terms = sanitized.split(/\s+/).filter(term => term.length > 0);
        
        if (terms.length === 0) return '';
        
        // If we have just one term, don't add operators
        if (terms.length === 1) return terms[0];
        
        // For multiple terms, join with the specified operator
        // Format each term as a prefix search to improve matching
        const formattedTerms = terms.map(term => term + ':*');
        return formattedTerms.join(` ${operator} `);
      } catch (e) {
        console.error('Error preparing search query:', e);
        // Return a safe fallback
        return input.trim().replace(/['&|!():*]/g, '');
      }
    };

    if (searchType === 'keyword') {
      // Perform keyword-only search
      console.log('Executing keyword search query...');
      
      // Process query to handle multiple words properly
      const processedQuery = prepareSearchQuery(query, '&');
      // Fallback query uses OR logic for broader matches
      const fallbackQuery = prepareSearchQuery(query, '|');
      
      console.log('Processed query:', processedQuery);
      
      // Modified to give higher weight to post titles
      const results = await sql`
        WITH RankedResults AS (
          SELECT 
            content,
            post_slug,
            post_title,
            chunk_type,
            metadata,
            CASE 
              -- Give higher score to title matches
              WHEN to_tsvector('english', post_title) @@ to_tsquery('english', ${processedQuery}) THEN
                2.0 * ts_rank_cd(to_tsvector('english', post_title), to_tsquery('english', ${processedQuery}))
              ELSE
                ts_rank_cd(to_tsvector('english', content || ' ' || post_title), to_tsquery('english', ${processedQuery}))
            END as text_rank,
            -- Flag to indicate if this was a title match
            (to_tsvector('english', post_title) @@ to_tsquery('english', ${processedQuery})) as is_title_match
          FROM content_chunks
          WHERE 
            to_tsvector('english', content || ' ' || post_title) @@ to_tsquery('english', ${processedQuery})
            OR to_tsvector('english', post_title) @@ to_tsquery('english', ${processedQuery})
        )
        SELECT 
          content,
          post_slug,
          post_title,
          chunk_type,
          metadata,
          text_rank as keyword_score,
          is_title_match
        FROM RankedResults
        ORDER BY is_title_match DESC, keyword_score DESC
        LIMIT 25;
      `;

      console.log(`Found ${results.rows.length} keyword results`);

      // No fallbacks for keyword search - strict matching only
      if (results.rows.length === 0) {
        return NextResponse.json({
          results: [],
          message: "No exact matches found for your query"
        });
      }

      return NextResponse.json({
        results: results.rows.map((row) => ({
          ...row,
          similarity: row.keyword_score,
        })),
      });
    } else {
      // Generate embedding for semantic search
      console.log('Generating embedding for semantic search...');
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

      // Default behavior: hybrid search (semantic + keyword)
      if (searchType === 'hybrid') {
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

        console.log(`Found ${results.rows.length} hybrid results`);

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
      } else if (searchType === 'semantic') {
        // Pure semantic/vector search
        console.log('Executing pure semantic search query...');
        const results = await sql`
          SELECT 
            content,
            post_slug,
            post_title,
            chunk_type,
            metadata,
            1 - (embedding <=> ${formattedEmbedding}::vector) as vector_similarity
          FROM content_chunks
          WHERE 1 - (embedding <=> ${formattedEmbedding}::vector) > 0.4
          ORDER BY vector_similarity DESC
          LIMIT 25;
        `;

        console.log(`Found ${results.rows.length} semantic results`);

        if (results.rows.length === 0) {
          console.log('No semantic results, trying more lenient search...');
          const fallbackResults = await sql`
            SELECT 
              content,
              post_slug,
              post_title,
              chunk_type,
              metadata,
              1 - (embedding <=> ${formattedEmbedding}::vector) as vector_similarity
            FROM content_chunks
            ORDER BY vector_similarity DESC
            LIMIT 15;
          `;

          return NextResponse.json({
            results: fallbackResults.rows.map((row) => ({
              ...row,
              similarity: row.vector_similarity,
            })),
            fallback: true,
          });
        }

        return NextResponse.json({
          results: results.rows.map((row) => ({
            ...row,
            similarity: row.vector_similarity,
          })),
        });
      }
    }

    // Fallback for invalid search type
    return NextResponse.json(
      { error: 'Invalid search type. Use "keyword", "semantic", or "hybrid"' },
      { status: 400 }
    );
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
