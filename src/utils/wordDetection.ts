// utils/wordDetection.ts

import type { Tile } from "./letterBag";

const GRID_COLS = 7;
const GRID_ROWS = 6;

export interface WordMatch {
  word: string;
  indices: number[];
  direction: 'horizontal' | 'vertical';
}

// Dictionary will be loaded from file
let VALID_WORDS: Set<string> = new Set();
let dictionaryLoaded = false;

// Load dictionary from file
export async function loadDictionary(): Promise<void> {
  if (dictionaryLoaded) return;

  try {
    const response = await fetch('/src/assets/words_alpha.txt');
    const text = await response.text();
    const words = text.split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length >= 3);
    VALID_WORDS = new Set(words);
    dictionaryLoaded = true;
    console.log(`Dictionary loaded: ${VALID_WORDS.size} words`);
  } catch (error) {
    console.error('Failed to load dictionary:', error);
    // Fallback to basic words
    VALID_WORDS = new Set(['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER']);
    dictionaryLoaded = true;
  }
}

export function isValidWord(word: string): boolean {
  return word.length >= 3 && VALID_WORDS.has(word.toUpperCase());
}

// Extract horizontal words (left to right and right to left)
function findHorizontalWords(grid: (Tile | null)[]): WordMatch[] {
  const words: WordMatch[] = [];

  for (let row = 0; row < GRID_ROWS; row++) {
    let currentWord = '';
    let currentIndices: number[] = [];

    for (let col = 0; col < GRID_COLS; col++) {
      const index = row * GRID_COLS + col;
      const tile = grid[index];

      if (tile) {
        currentWord += tile.letter;
        currentIndices.push(index);
      } else {
        // Check if we have a word
        if (currentWord.length >= 3) {
          // Check left-to-right
          if (isValidWord(currentWord)) {
            words.push({
              word: currentWord,
              indices: [...currentIndices],
              direction: 'horizontal'
            });
          }
          // Check right-to-left
          const reversed = currentWord.split('').reverse().join('');
          if (isValidWord(reversed)) {
            words.push({
              word: reversed,
              indices: [...currentIndices].reverse(),
              direction: 'horizontal'
            });
          }
        }
        currentWord = '';
        currentIndices = [];
      }
    }

    // Check end of row
    if (currentWord.length >= 3) {
      if (isValidWord(currentWord)) {
        words.push({
          word: currentWord,
          indices: [...currentIndices],
          direction: 'horizontal'
        });
      }
      const reversed = currentWord.split('').reverse().join('');
      if (isValidWord(reversed)) {
        words.push({
          word: reversed,
          indices: [...currentIndices].reverse(),
          direction: 'horizontal'
        });
      }
    }
  }

  return words;
}

// Extract vertical words (top to bottom and bottom to top)
function findVerticalWords(grid: (Tile | null)[]): WordMatch[] {
  const words: WordMatch[] = [];

  for (let col = 0; col < GRID_COLS; col++) {
    let currentWord = '';
    let currentIndices: number[] = [];

    for (let row = 0; row < GRID_ROWS; row++) {
      const index = row * GRID_COLS + col;
      const tile = grid[index];

      if (tile) {
        currentWord += tile.letter;
        currentIndices.push(index);
      } else {
        // Check if we have a word
        if (currentWord.length >= 3) {
          // Check top-to-bottom
          if (isValidWord(currentWord)) {
            words.push({
              word: currentWord,
              indices: [...currentIndices],
              direction: 'vertical'
            });
          }
          // Check bottom-to-top
          const reversed = currentWord.split('').reverse().join('');
          if (isValidWord(reversed)) {
            words.push({
              word: reversed,
              indices: [...currentIndices].reverse(),
              direction: 'vertical'
            });
          }
        }
        currentWord = '';
        currentIndices = [];
      }
    }

    // Check end of column
    if (currentWord.length >= 3) {
      if (isValidWord(currentWord)) {
        words.push({
          word: currentWord,
          indices: [...currentIndices],
          direction: 'vertical'
        });
      }
      const reversed = currentWord.split('').reverse().join('');
      if (isValidWord(reversed)) {
        words.push({
          word: reversed,
          indices: [...currentIndices].reverse(),
          direction: 'vertical'
        });
      }
    }
  }

  return words;
}

// Filter to keep only the largest words when overlapping
function filterLargestWords(words: WordMatch[]): WordMatch[] {
  if (words.length === 0) return [];

  // Sort by length descending
  const sorted = [...words].sort((a, b) => b.word.length - a.word.length);
  const kept: WordMatch[] = [];

  for (const word of sorted) {
    // Check if this word's indices are a subset of any already kept word
    const isSubset = kept.some(keptWord => {
      if (keptWord.direction !== word.direction) return false;
      return word.indices.every(idx => keptWord.indices.includes(idx));
    });

    if (!isSubset) {
      kept.push(word);
    }
  }

  return kept;
}

export function detectWords(grid: (Tile | null)[]): WordMatch[] {
  const horizontalWords = findHorizontalWords(grid);
  const verticalWords = findVerticalWords(grid);

  // Filter each direction separately for largest words
  const filteredHorizontal = filterLargestWords(horizontalWords);
  const filteredVertical = filterLargestWords(verticalWords);

  return [...filteredHorizontal, ...filteredVertical];
}

export function getTileHighlight(index: number, words: WordMatch[]): 'horizontal' | 'vertical' | 'both' | null {
  let inHorizontal = false;
  let inVertical = false;

  for (const word of words) {
    if (word.indices.includes(index)) {
      if (word.direction === 'horizontal') {
        inHorizontal = true;
      } else {
        inVertical = true;
      }
    }
  }

  if (inHorizontal && inVertical) return 'both';
  if (inHorizontal) return 'horizontal';
  if (inVertical) return 'vertical';
  return null;
}

// Find all words that contain a specific tile index
export function findWordsContainingTile(tileIndex: number, words: WordMatch[]): WordMatch[] {
  return words.filter(word => word.indices.includes(tileIndex));
}

// Recursively find all connected words in a chain
export function findConnectedWordChain(startingTileIndex: number, words: WordMatch[]): WordMatch[] {
  const connectedWords = new Set<WordMatch>();
  const processedIndices = new Set<number>();
  const wordsToProcess = [...findWordsContainingTile(startingTileIndex, words)];

  // Add all starting words to the connected set
  wordsToProcess.forEach(word => connectedWords.add(word));

  while (wordsToProcess.length > 0) {
    const currentWord = wordsToProcess.shift()!;

    // Mark all indices in this word as processed
    currentWord.indices.forEach(idx => processedIndices.add(idx));

    // Find all words that share any tile with the current word
    for (const word of words) {
      // Skip if we've already added this word
      if (connectedWords.has(word)) continue;

      // Check if this word shares any tiles with the current word
      const hasSharedTile = word.indices.some(idx => processedIndices.has(idx));

      if (hasSharedTile) {
        connectedWords.add(word);
        wordsToProcess.push(word);
      }
    }
  }

  return Array.from(connectedWords);
}

// Get all unique tile indices from a list of words
export function getUniqueIndicesFromWords(words: WordMatch[]): number[] {
  const indices = new Set<number>();
  words.forEach(word => {
    word.indices.forEach(idx => indices.add(idx));
  });
  return Array.from(indices).sort((a, b) => a - b);
}

// Calculate score for a list of words, using tile data from the grid
export function calculateWordChainScore(words: WordMatch[], grid: (Tile | null)[]): number {
  let score = 0;

  for (const word of words) {
    // Calculate score for each tile in the word
    let wordScore = 0;
    for (const tileIndex of word.indices) {
      const tile = grid[tileIndex];
      if (tile) {
        // Apply the tile's multiplier to its base score
        wordScore += tile.score * tile.multiplier;
      }
    }

    // Bonus for longer words (applied to the total word score)
    let lengthMultiplier = 1;
    if (word.word.length >= 7) lengthMultiplier = 1.5;
    else if (word.word.length >= 5) lengthMultiplier = 1.25;

    score += Math.floor(wordScore * lengthMultiplier);
  }

  // Bonus for multiple words in one chain
  if (words.length > 1) {
    score += words.length * 10;
  }

  return score;
}
