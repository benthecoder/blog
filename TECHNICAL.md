# Technical Documentation

This document provides technical details about the search functionality and vector embedding system implemented in this blog.

## Search Implementation

The blog features a multi-modal search system that allows users to find content through three different search types:

### 1. Search Types

- **Keyword Search**: Traditional text-based search using PostgreSQL's full-text search capabilities
- **Semantic Search**: Vector-based search using embeddings to find conceptually related content
- **Hybrid Search**: A weighted combination of both keyword and semantic search

### 2. Search Architecture

The search system consists of these main components:

#### Frontend (`app/search/page.tsx`)
- React component with search input and type toggling
- Maintains search state and parameters in URL and session storage
- Displays results with formatting based on content type
- Shows match percentage based on the relevant score (hybrid_score, keyword_score, or vector_similarity)

#### API Endpoint (`app/api/search/route.ts`)
- Handles search requests with different search types
- Generates embeddings for semantic/hybrid search using VoyageAI
- Executes PostgreSQL queries with vector operations
- Implements fallback searches when no results are found
- Returns normalized results with appropriate scoring

#### Database Schema
```sql
CREATE TABLE content_chunks (
  id UUID PRIMARY KEY,
  post_slug TEXT,
  post_title TEXT,
  content TEXT,
  chunk_type TEXT,
  metadata JSONB,
  sequence INTEGER,
  embedding vector(512),
  overlaps_with UUID[],
  overlap_score FLOAT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Search Algorithm

#### Keyword Search
Uses PostgreSQL's `to_tsvector` and `plainto_tsquery` with rank functions to find and score exact text matches:

```sql
SELECT 
  content, post_slug, post_title, chunk_type, metadata,
  ts_rank(
    to_tsvector('english', content || ' ' || post_title),
    plainto_tsquery('english', ${query})
  ) as text_rank
FROM content_chunks
WHERE to_tsvector('english', content || ' ' || post_title) @@ plainto_tsquery('english', ${query})
```

#### Semantic Search
Uses vector similarity with the cosine distance operator `<=>` to find conceptually similar content:

```sql
SELECT 
  content, post_slug, post_title, chunk_type, metadata,
  1 - (embedding <=> ${formattedEmbedding}::vector) as vector_similarity
FROM content_chunks
WHERE 1 - (embedding <=> ${formattedEmbedding}::vector) > 0.4
```

#### Hybrid Search
Combines both approaches with weighted scoring (70% vector, 30% text):

```sql
(vector_similarity * 0.7 + COALESCE(text_rank, 0) * 0.3) as hybrid_score
```

## Content Processing and Embedding Generation

### 1. Content Chunking (`utils/processMarkdownChunks.ts`)

The blog content is processed through a sophisticated chunking system:

#### Chunking Strategy
- **Sliding Window**: Chunks overlap to maintain context between segments
- **Content-Aware**: Different chunk types (paragraphs, code, lists, quotes)
- **Context Preservation**: Metadata tracks section information and relationships

#### Key Parameters
- `MIN_CHUNK_LENGTH`: Minimum size (150 chars) for a standalone chunk
- `MAX_CHUNK_LENGTH`: Target size (600 chars) for chunks
- `OVERLAP_PERCENTAGE`: 30% overlap between sliding windows
- `OVERLAP_MIN_CHARS`: Minimum overlap of 100 characters
- `OVERLAP_MAX_CHARS`: Maximum overlap of 200 characters

#### Chunk Types
- Paragraphs (main content)
- Code blocks (with language metadata)
- Bullet lists (with count metadata)
- Blockquotes
- Mixed content (small elements combined)

### 2. Embedding Generation (`scripts/generateEmbeddings.ts`)

#### Embedding Process
1. Content is processed into semantic chunks
2. Each chunk is embedded using VoyageAI's `voyage-3-lite` model
3. Embeddings are stored with metadata in PostgreSQL with pgvector

#### Performance Optimizations
- **Batching**: Processes chunks in batches of 20
- **Rate Limiting**: Includes delays between batches (200ms) and files (1000ms)
- **Retry Logic**: Exponential backoff for API rate limits
- **Transaction Safety**: Only updates embeddings for modified files

#### Overlap Analysis
- Tracks relationships between sequential chunks
- Records overlap scores for improved context retrieval
- Enables "chunking with memory" for more coherent search results

### 3. Automatic Embedding Update (`generate-embeddings.yml`)

A GitHub Actions workflow automatically updates embeddings when content changes:

```yaml
name: Generate Blog Post Embeddings

on:
  push:
    paths:
      - 'posts/*.md'
    branches:
      - main

jobs:
  generate-embeddings:
    runs-on: ubuntu-latest
    
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      VOYAGE_AI_API_KEY: ${{ secrets.VOYAGE_AI_API_KEY }}
    
    steps:
      # Setup and identify changed files
      - name: Generate embeddings for changed files
        run: |
          for file in ${{ steps.changed-files.outputs.all_changed_files }}; do
            filename=$(basename "$file")
            slug="${filename%.md}"
            npx tsx scripts/generateEmbeddings.ts "$slug"
          done
```

This system:
1. Triggers on content changes
2. Identifies modified files
3. Regenerates embeddings only for changed content
4. Preserves existing embeddings for unchanged content

## Performance Considerations

- Vector operations can be computationally expensive; indexes optimize query performance
- Embeddings are generated asynchronously, not during page load
- The search UI is client-side with loading states to handle API response time
- Session storage caches recent search results to reduce redundant API calls