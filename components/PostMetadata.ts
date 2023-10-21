export interface PostMetadata {
  title: string;
  date: string;
  tags: string;
  wordcount: number;
  slug: string;
  prev?: PostMetadata | null;
  next?: PostMetadata | null;
}
