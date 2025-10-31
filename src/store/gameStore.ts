// store/gameStore.ts
import { create } from "zustand";

// Track claimed words by their indices pattern
interface ClaimedWord {
  word: string;
  indices: number[];
  direction: 'horizontal' | 'vertical';
}

type Turn = 'player' | 'world';

type GameState = {
  score: number;
  claimedWords: ClaimedWord[];
  currentTurn: Turn;
  worldSeed: number;
  worldTurnCount: number; // Track how many turns the world has taken
  addScore: (points: number) => void;
  addClaimedWords: (words: ClaimedWord[]) => void;
  setTurn: (turn: Turn) => void;
  setWorldSeed: (seed: number) => void;
  incrementWorldTurnCount: () => void;
};

export const useGameStore = create<GameState>(set => ({
  score: 0,
  claimedWords: [],
  currentTurn: 'player',
  worldSeed: 0,
  worldTurnCount: 0,
  addScore: points => set(state => ({ score: state.score + points })),
  addClaimedWords: words => set(state => ({
    claimedWords: [...state.claimedWords, ...words]
  })),
  setTurn: turn => set({ currentTurn: turn }),
  setWorldSeed: seed => set({ worldSeed: seed }),
  incrementWorldTurnCount: () => set(state => ({ worldTurnCount: state.worldTurnCount + 1 })),
}));