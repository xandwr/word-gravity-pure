/*
    $lib/game/wordValidator.svelte.ts

    Word validation system that:
    - Loads dictionary from static/words_alpha.txt
    - Finds all valid words on the board (horizontal/vertical, both directions)
    - Tracks which tiles belong to which valid words
    - Provides highlighting information for tiles
*/

import type { TileData } from "./types";

export type WordDirection = "horizontal" | "vertical";

export type ValidWord = {
    word: string;
    direction: WordDirection;
    tileIndices: number[]; // Board indices of tiles forming this word
};

export type TileHighlight = "none" | "horizontal" | "vertical" | "intersection";

class WordValidator {
    private dictionary: Set<string> = $state(new Set());
    private isLoaded = $state(false);
    private validWords = $state<ValidWord[]>([]);
    private tileHighlights = $state<Map<number, TileHighlight>>(new Map());

    constructor() {
        this.loadDictionary();
    }

    get loaded(): boolean {
        return this.isLoaded;
    }

    get words(): ValidWord[] {
        return this.validWords;
    }

    get highlights(): Map<number, TileHighlight> {
        return this.tileHighlights;
    }

    private async loadDictionary() {
        try {
            const response = await fetch("/words_alpha.txt");
            const text = await response.text();

            // Split by newlines and normalize to uppercase
            const words = text
                .split(/\r?\n/)
                .map(w => w.trim().toUpperCase())
                .filter(w => w.length > 0);

            this.dictionary = new Set(words);
            this.isLoaded = true;

            console.log(`Dictionary loaded: ${this.dictionary.size} words`);
        } catch (error) {
            console.error("Failed to load dictionary:", error);
        }
    }

    /**
     * Check if a word exists in the dictionary
     */
    isValidWord(word: string): boolean {
        return this.dictionary.has(word.toUpperCase());
    }

    /**
     * Validate the board and find all valid words
     * @param board - Array of tile containers (7 cols x 6 rows)
     * @param cols - Number of columns (default 7)
     * @param rows - Number of rows (default 6)
     */
    validateBoard(
        board: Array<{ heldLetterTile: TileData | null }>,
        cols: number = 7,
        rows: number = 6
    ) {
        if (!this.isLoaded) {
            return;
        }

        const foundWords: ValidWord[] = [];

        // Helper to get tile at position
        const getTile = (row: number, col: number): TileData | null => {
            if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
            const index = row * cols + col;
            return board[index]?.heldLetterTile ?? null;
        };

        // Helper to get board index from row/col
        const getIndex = (row: number, col: number): number => {
            return row * cols + col;
        };

        // Check horizontal words (left-to-right and right-to-left)
        for (let row = 0; row < rows; row++) {
            for (let startCol = 0; startCol < cols; startCol++) {
                // Left-to-right
                let word = "";
                let indices: number[] = [];

                for (let col = startCol; col < cols; col++) {
                    const tile = getTile(row, col);
                    if (!tile) break;

                    word += tile.letter;
                    indices.push(getIndex(row, col));
                }

                // Only consider words with 2+ letters
                if (word.length >= 2 && this.isValidWord(word)) {
                    foundWords.push({
                        word,
                        direction: "horizontal",
                        tileIndices: indices
                    });
                }

                // Right-to-left (reverse)
                if (word.length >= 2) {
                    const reversedWord = word.split("").reverse().join("");
                    if (this.isValidWord(reversedWord)) {
                        foundWords.push({
                            word: reversedWord,
                            direction: "horizontal",
                            tileIndices: [...indices].reverse()
                        });
                    }
                }
            }
        }

        // Check vertical words (top-to-bottom and bottom-to-top)
        for (let col = 0; col < cols; col++) {
            for (let startRow = 0; startRow < rows; startRow++) {
                // Top-to-bottom
                let word = "";
                let indices: number[] = [];

                for (let row = startRow; row < rows; row++) {
                    const tile = getTile(row, col);
                    if (!tile) break;

                    word += tile.letter;
                    indices.push(getIndex(row, col));
                }

                // Only consider words with 2+ letters
                if (word.length >= 2 && this.isValidWord(word)) {
                    foundWords.push({
                        word,
                        direction: "vertical",
                        tileIndices: indices
                    });
                }

                // Bottom-to-top (reverse)
                if (word.length >= 2) {
                    const reversedWord = word.split("").reverse().join("");
                    if (this.isValidWord(reversedWord)) {
                        foundWords.push({
                            word: reversedWord,
                            direction: "vertical",
                            tileIndices: [...indices].reverse()
                        });
                    }
                }
            }
        }

        // Remove duplicate words (same indices)
        const uniqueWords = this.deduplicateWords(foundWords);

        // Update state
        this.validWords = uniqueWords;
        this.updateHighlights(uniqueWords);
    }

    /**
     * Remove duplicate words based on their tile indices
     */
    private deduplicateWords(words: ValidWord[]): ValidWord[] {
        const seen = new Set<string>();
        const unique: ValidWord[] = [];

        for (const word of words) {
            // Create a key from sorted indices to detect duplicates
            const key = word.tileIndices.slice().sort((a, b) => a - b).join(",");

            if (!seen.has(key)) {
                seen.add(key);
                unique.push(word);
            }
        }

        return unique;
    }

    /**
     * Update tile highlights based on valid words
     */
    private updateHighlights(words: ValidWord[]) {
        const highlights = new Map<number, TileHighlight>();

        for (const validWord of words) {
            for (const index of validWord.tileIndices) {
                const current = highlights.get(index);

                if (!current || current === "none") {
                    // First time seeing this tile
                    highlights.set(index, validWord.direction);
                } else if (current !== validWord.direction) {
                    // Tile is part of both horizontal and vertical words
                    highlights.set(index, "intersection");
                }
                // If current === validWord.direction, keep it as is
            }
        }

        this.tileHighlights = highlights;
    }

    /**
     * Get highlight type for a specific board tile
     */
    getHighlight(boardIndex: number): TileHighlight {
        return this.tileHighlights.get(boardIndex) ?? "none";
    }

    /**
     * Clear all validation results
     */
    clear() {
        this.validWords = [];
        this.tileHighlights = new Map();
    }
}

// Export singleton instance
export const wordValidator = new WordValidator();
