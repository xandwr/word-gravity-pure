// app/lib/bag.ts

/**
 * Letter bag creation and tile management.
 * Creates deterministic tile sets based on seed.
 */

import { Tile } from "../types";
import { createSeededRNG, shuffle } from "./seed";

/**
 * Letter distribution based on Scrabble-like frequency
 * Format: [letter, count, baseScore]
 */
const LETTER_DISTRIBUTION: [string, number, number][] = [
  ['A', 9, 1],
  ['B', 2, 3],
  ['C', 2, 3],
  ['D', 4, 2],
  ['E', 12, 1],
  ['F', 2, 4],
  ['G', 3, 2],
  ['H', 2, 4],
  ['I', 9, 1],
  ['J', 1, 8],
  ['K', 1, 5],
  ['L', 4, 1],
  ['M', 2, 3],
  ['N', 6, 1],
  ['O', 8, 1],
  ['P', 2, 3],
  ['Q', 1, 10],
  ['R', 6, 1],
  ['S', 4, 1],
  ['T', 6, 1],
  ['U', 4, 1],
  ['V', 2, 4],
  ['W', 2, 4],
  ['X', 1, 8],
  ['Y', 2, 4],
  ['Z', 1, 10],
];

/**
 * Total number of tiles in a standard bag
 */
export const TOTAL_TILES = LETTER_DISTRIBUTION.reduce((sum, [, count]) => sum + count, 0);

/**
 * Generates a unique ID for a tile
 */
let tileIdCounter = 0;
export function generateTileId(): string {
  return `tile-${Date.now()}-${tileIdCounter++}`;
}

/**
 * Creates a single tile
 */
export function createTile(letter: string, baseScore: number, mult: number = 1): Tile {
  return {
    id: generateTileId(),
    letter,
    base: baseScore,
    mult,
  };
}

/**
 * Creates a deterministic letter bag from a seed string
 * Returns an array of shuffled tiles
 */
export function createLetterBag(seed: string): Tile[] {
  const prng = createSeededRNG(seed);
  const tiles: Tile[] = [];

  // Create all tiles according to distribution
  for (const [letter, count, baseScore] of LETTER_DISTRIBUTION) {
    for (let i = 0; i < count; i++) {
      tiles.push(createTile(letter, baseScore));
    }
  }

  // Shuffle deterministically using the seed
  return shuffle(prng, tiles);
}

/**
 * Draws N tiles from the bag
 * Returns [drawnTiles, remainingBag]
 */
export function drawTiles(bag: Tile[], count: number): [Tile[], Tile[]] {
  const drawn = bag.slice(0, count);
  const remaining = bag.slice(count);
  return [drawn, remaining];
}

/**
 * Returns a tile back to the bag (for swapping)
 * Places it at a random position in the bag
 */
export function returnTileToBag(bag: Tile[], tile: Tile, seed: string): Tile[] {
  const prng = createSeededRNG(seed + tile.id);
  const newBag = [...bag, tile];
  return shuffle(prng, newBag);
}

/**
 * Counts remaining tiles of each letter in the bag
 */
export function countLettersInBag(bag: Tile[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const tile of bag) {
    counts[tile.letter] = (counts[tile.letter] || 0) + 1;
  }
  return counts;
}
