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

export interface ChunkMetadata {
  section?: string;
  language?: string;
  level?: number;
  wordCount?: number;
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
