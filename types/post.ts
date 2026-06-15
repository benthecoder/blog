export interface PostMetadata {
  title: string;
  date: string;
  tags: string;
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
  [key: string]: unknown;
}

export interface ParsedPost {
  data: PostFrontmatter;
  content: string;
}
