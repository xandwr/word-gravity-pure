// utils/letterBag.ts

import { SeededRandom } from "./seededRandom";

export interface Tile {
  id: string;
  letter: string;
  score: number;
  multiplier: number;
  placedBy?: 'player' | 'world'; // Track who placed this tile
}

// Scrabble letter distribution
const SCRABBLE_DISTRIBUTION: Record<string, { count: number; score: number }> = {
  'A': { count: 9, score: 1 },
  'B': { count: 2, score: 3 },
  'C': { count: 2, score: 3 },
  'D': { count: 4, score: 2 },
  'E': { count: 12, score: 1 },
  'F': { count: 2, score: 4 },
  'G': { count: 3, score: 2 },
  'H': { count: 2, score: 4 },
  'I': { count: 9, score: 1 },
  'J': { count: 1, score: 8 },
  'K': { count: 1, score: 5 },
  'L': { count: 4, score: 1 },
  'M': { count: 2, score: 3 },
  'N': { count: 6, score: 1 },
  'O': { count: 8, score: 1 },
  'P': { count: 2, score: 3 },
  'Q': { count: 1, score: 10 },
  'R': { count: 6, score: 1 },
  'S': { count: 4, score: 1 },
  'T': { count: 6, score: 1 },
  'U': { count: 4, score: 1 },
  'V': { count: 2, score: 4 },
  'W': { count: 2, score: 4 },
  'X': { count: 1, score: 8 },
  'Y': { count: 2, score: 4 },
  'Z': { count: 1, score: 10 },
};

export function createLetterBag(seed?: number): Tile[] {
  const bag: Tile[] = [];
  let tileId = 0;

  for (const [letter, { count, score }] of Object.entries(SCRABBLE_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      bag.push({
        id: `tile-${tileId++}`,
        letter,
        score,
        multiplier: 1,
      });
    }
  }

  // Shuffle the bag deterministically if seed provided, otherwise random
  if (seed !== undefined) {
    const rng = new SeededRandom(seed);
    // Fisher-Yates shuffle with seeded random
    for (let i = bag.length - 1; i > 0; i--) {
      const j = rng.nextInt(0, i + 1);
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  } else {
    // Random shuffle (fallback for backwards compatibility)
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }

  return bag;
}

export function drawTiles(bag: Tile[], count: number): { drawn: Tile[]; remaining: Tile[] } {
  const drawn = bag.slice(0, count);
  const remaining = bag.slice(count);
  return { drawn, remaining };
}
