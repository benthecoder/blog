/**
 * Clean TypeScript types for the chunking system
 * Following KISS & DRY principles
 */

import { Node } from "unist";
import { PostFrontmatter } from "./post";

/**
 * The four chunk types we support (simplified from 7)
 */
export type ChunkType = "full-post" | "section" | "quote" | "code";

/**
 * Context passed to chunking strategies
 */
export interface ChunkContext {
  frontmatter: PostFrontmatter;
  slug: string;
  fullContent: string;
  currentSection: string;
}

/**
 * A processed chunk ready for embedding
 */
export interface ProcessedChunk {
  type: ChunkType;
  content: string;
  metadata: ChunkMetadata;
  sequence: number;
}

/**
 * Metadata stored with each chunk
 */
export interface ChunkMetadata {
  section?: string; // Section heading (if applicable)
  language?: string; // Code language (if type=code)
  level?: number; // Heading level (if type=section)
  wordCount?: number; // For analytics
  [key: string]: any; // Allow additional metadata
}

/**
 * Interface that all chunk extractors must implement
 */
export interface ChunkExtractor {
  /**
   * The chunk type this extractor produces
   */
  readonly chunkType: ChunkType;

  /**
   * Process a markdown AST and extract chunks
   * @param tree - Unified/remark AST
   * @param context - Context about the post
   * @returns Array of processed chunks
   */
  process(tree: Node, context: ChunkContext): ProcessedChunk[];
}

/**
 * Result of processing a markdown file
 */
export interface ProcessedPost {
  frontmatter: PostFrontmatter;
  chunks: ProcessedChunk[];
  filePath: string;
}
