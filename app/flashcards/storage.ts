export interface Flashcard {
  id: string;
  topicId: number;
  topicTitle: string;
  question: string;
  answer: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string; // ISO date
}

const CARDS_KEY = "flashcards_v1";

export function loadCards(): Flashcard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveCards(cards: Flashcard[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}
