import { Node } from "unist";
import { PostFrontmatter } from "./post";

export type ChunkType = "full-post" | "section" | "quote" | "code";

export interface ChunkContext {
  frontmatter: PostFrontmatter;
  slug: string;
  fullContent: string;
  currentSection: string;
}

export interface ProcessedChunk {
  type: ChunkType;
  content: string;
  metadata: ChunkMetadata;
  sequence: number;
}

interface ChunkMetadata {
  section?: string;
  language?: string;
  level?: number;
  wordCount?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ChunkExtractor {
  readonly chunkType: ChunkType;
  process(tree: Node, context: ChunkContext): ProcessedChunk[];
}

export interface ProcessedPost {
  frontmatter: PostFrontmatter;
  chunks: ProcessedChunk[];
  filePath: string;
}

export interface ChunkRow {
  id: string;
  post_slug: string;
  post_title: string;
  content: string;
  chunk_type: string;
  metadata: {
    published_date?: string;
    tags?: string[];
  };
  sequence: number;
  embedding: unknown;
  created_at: string;
}
