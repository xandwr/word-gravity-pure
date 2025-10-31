// utils/worldTurn.ts
import { SeededRandom } from "./seededRandom";
import type { Tile } from "./letterBag";

const GRID_COLS = 7;

// Letter distribution for world's infinite bag (same as Scrabble)
const LETTER_WEIGHTS: { letter: string; score: number; weight: number }[] = [
  { letter: 'A', score: 1, weight: 9 },
  { letter: 'B', score: 3, weight: 2 },
  { letter: 'C', score: 3, weight: 2 },
  { letter: 'D', score: 2, weight: 4 },
  { letter: 'E', score: 1, weight: 12 },
  { letter: 'F', score: 4, weight: 2 },
  { letter: 'G', score: 2, weight: 3 },
  { letter: 'H', score: 4, weight: 2 },
  { letter: 'I', score: 1, weight: 9 },
  { letter: 'J', score: 8, weight: 1 },
  { letter: 'K', score: 5, weight: 1 },
  { letter: 'L', score: 1, weight: 4 },
  { letter: 'M', score: 3, weight: 2 },
  { letter: 'N', score: 1, weight: 6 },
  { letter: 'O', score: 1, weight: 8 },
  { letter: 'P', score: 3, weight: 2 },
  { letter: 'Q', score: 10, weight: 1 },
  { letter: 'R', score: 1, weight: 6 },
  { letter: 'S', score: 1, weight: 4 },
  { letter: 'T', score: 1, weight: 6 },
  { letter: 'U', score: 1, weight: 4 },
  { letter: 'V', score: 4, weight: 2 },
  { letter: 'W', score: 4, weight: 2 },
  { letter: 'X', score: 8, weight: 1 },
  { letter: 'Y', score: 4, weight: 2 },
  { letter: 'Z', score: 10, weight: 1 },
];

// Calculate total weight for weighted random selection
const TOTAL_WEIGHT = LETTER_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);

// Generate a deterministic letter based on seed and turn count
function getWorldLetter(rng: SeededRandom): { letter: string; score: number } {
  const randomValue = rng.next() * TOTAL_WEIGHT;
  let cumulativeWeight = 0;

  for (const item of LETTER_WEIGHTS) {
    cumulativeWeight += item.weight;
    if (randomValue < cumulativeWeight) {
      return { letter: item.letter, score: item.score };
    }
  }

  // Fallback (should never reach here)
  return { letter: 'E', score: 1 };
}

// Get available columns (columns that are not full)
function getAvailableColumns(grid: (Tile | null)[]): number[] {
  const available: number[] = [];

  for (let col = 0; col < GRID_COLS; col++) {
    const topIndex = col; // Top row index
    if (!grid[topIndex]) {
      available.push(col);
    }
  }

  return available;
}

// Execute world's turn: pick a letter and place it in a column
export function executeWorldTurn(
  grid: (Tile | null)[],
  worldSeed: number,
  worldTurnCount: number
): { grid: (Tile | null)[]; tile: Tile; column: number } | null {
  const availableColumns = getAvailableColumns(grid);

  // If no columns available, world can't play
  if (availableColumns.length === 0) {
    return null;
  }

  // Create RNG with combined seed (base seed + turn count for uniqueness)
  const rng = new SeededRandom(worldSeed + worldTurnCount);

  // Pick a letter deterministically
  const { letter, score } = getWorldLetter(rng);

  // Pick a column deterministically
  const columnIndex = rng.nextInt(0, availableColumns.length);
  const column = availableColumns[columnIndex];

  // Create the tile, marked as placed by world
  const tile: Tile = {
    id: `world-${worldTurnCount}`,
    letter,
    score,
    multiplier: 1,
    placedBy: 'world',
  };

  // Place the tile at the top of the chosen column
  const newGrid = [...grid];
  newGrid[column] = tile;

  return { grid: newGrid, tile, column };
}
