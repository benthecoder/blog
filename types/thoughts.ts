export interface Thought {
  id: number;
  content: string;
  link?: string | null;
  link_title?: string | null;
  created_at: Date;
}
