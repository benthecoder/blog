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

/** Parsed markdown file — frontmatter + body content. */
export interface ParsedPost {
  data: PostFrontmatter;
  content: string;
}
