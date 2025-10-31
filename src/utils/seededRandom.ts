// utils/seededRandom.ts
// Deterministic seeded random number generator using mulberry32 algorithm

export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Generate next random number between 0 and 1
  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Generate random integer between min (inclusive) and max (exclusive)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  // Reset to initial seed
  reset(newSeed: number) {
    this.seed = newSeed;
  }
}

// Get today's seed based on date (same for everyone worldwide)
export function getTodaysSeed(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Create a unique seed from the date
  return year * 10000 + month * 100 + day;
}
