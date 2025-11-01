// app/lib/seed.ts

/**
 * Deterministic PRNG and seed utilities for daily game generation.
 * Ensures all players worldwide get the same puzzle each day.
 */

/**
 * Mulberry32 PRNG - fast, deterministic pseudo-random number generator
 * Returns a function that generates numbers between 0 and 1
 */
export function createPRNG(seed: number) {
  let state = seed;
  return function() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Converts a string seed to a numeric value for PRNG initialization
 */
export function hashSeed(seedStr: string): number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    const char = seedStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generates a daily seed string from current UTC date
 * Format: YYYY-MM-DD
 */
export function getDailySeed(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates a random integer between min (inclusive) and max (inclusive)
 */
export function randomInt(prng: () => number, min: number, max: number): number {
  return Math.floor(prng() * (max - min + 1)) + min;
}

/**
 * Shuffles an array in-place using Fisher-Yates algorithm with given PRNG
 * Returns the same array for chaining
 */
export function shuffle<T>(prng: () => number, array: T[]): T[] {
  const arr = [...array]; // Create a copy to avoid mutating original
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Picks a random element from an array
 */
export function randomElement<T>(prng: () => number, array: T[]): T {
  const index = Math.floor(prng() * array.length);
  return array[index];
}

/**
 * Creates a seeded random number generator from a date string
 */
export function createSeededRNG(seedStr: string) {
  const numericSeed = hashSeed(seedStr);
  return createPRNG(numericSeed);
}
