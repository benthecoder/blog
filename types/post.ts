/**
 * Post-related type definitions
 * Consolidates all post metadata and frontmatter types
 */

/**
 * Post metadata including navigation references
 */
export interface PostMetadata {
  title: string;
  date: string;
  tags: string;
  wordcount: number;
  slug: string;
  prev?: PostMetadata | null;
  next?: PostMetadata | null;
}

/**
 * Frontmatter data from markdown files
 */
export interface PostFrontmatter {
  title?: string;
  tags?: string[] | string;
  date?: string;
  [key: string]: any;
}

/**
 * Post content with frontmatter
 */
export interface PostContent {
  frontmatter: PostFrontmatter;
  content: string;
}

/**
 * Content chunk stored in database (cleaned up schema)
 */
export interface ContentChunk {
  id: string;
  post_slug: string;
  post_title: string;
  content: string;
  chunk_type: string;
  metadata: Record<string, any>;
  sequence: number;
  embedding?: number[];
  published_date?: string; // Extracted from metadata JSONB into proper column
  tags?: string[]; // Extracted from metadata JSONB into proper column
  created_at?: Date;
}

/**
 * Content chunk row from database query
 */
export interface ContentChunkRow {
  post_slug: string;
  post_title: string;
  content: string;
  chunk_type: string;
  similarity: number;
  published_date?: string;
  tags?: string[];
}
