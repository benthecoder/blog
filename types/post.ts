import type { MarkdownFile } from "@/utils/content/markdown";
import type { PostFormat, PostFrontmatter } from "@/utils/content/schemas";

// The frontmatter shape is owned by the zod schema in utils/content/schemas.
export type { PostFormat, PostFrontmatter };

export interface PostMetadata {
  title: string;
  date: string;
  tags: string[];
  format?: PostFormat;
  locations?: string[];
  placeContext?: PostFrontmatter["place_context"];
  wordcount: number;
  slug: string;
  prev: PostMetadata | null;
  next: PostMetadata | null;
  isDraft?: boolean;
}

export type ParsedPost = MarkdownFile<PostFrontmatter>;
