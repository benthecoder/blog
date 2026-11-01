export type PostFormat = "journal" | "essay" | "book" | "links" | "resource";

export interface PostMetadata {
  title: string;
  date: string;
  tags: string[];
  format?: PostFormat;
  locations?: string[];
  placeContext?: "visit" | "transit" | "mention";
  wordcount: number;
  slug: string;
  prev: PostMetadata | null;
  next: PostMetadata | null;
  isDraft?: boolean;
}

export interface PostFrontmatter {
  title?: string;
  tags?: string[] | string;
  date?: string;
  format?: PostFormat;
  locations?: string[];
  [key: string]: unknown;
}

export interface ParsedPost {
  data: PostFrontmatter;
  content: string;
}
