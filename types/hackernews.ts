export interface HNStory {
  id: number;
  title: string;
  url: string;
  by: string;
  time: number;
  score: number;
  descendants?: number;
}
