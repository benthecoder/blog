export interface Flashcard {
  id: number;
  front: string;
  back: string;
  deck: string;
  tags: string[];
}

export interface FlashcardsData {
  cards: Flashcard[];
  count: number;
  decks: string[];
  deck: string;
  generatedAt: string;
}
