// store/gameStore.ts
import { create } from "zustand";

// Track claimed words by their indices pattern
interface ClaimedWord {
  word: string;
  indices: number[];
  direction: 'horizontal' | 'vertical';
}

type GameState = {
  score: number;
  claimedWords: ClaimedWord[];
  addScore: (points: number) => void;
  addClaimedWords: (words: ClaimedWord[]) => void;
};

export const useGameStore = create<GameState>(set => ({
  score: 0,
  claimedWords: [],
  addScore: points => set(state => ({ score: state.score + points })),
  addClaimedWords: words => set(state => ({
    claimedWords: [...state.claimedWords, ...words]
  })),
}));