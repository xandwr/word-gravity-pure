/*
    $lib/game/wordValidator.svelte.ts

    Word validation system that:
    - Loads dictionary from static/words_alpha.txt
    - Finds all valid words on the board (horizontal/vertical, both directions)
    - Tracks which tiles belong to which valid words
    - Provides highlighting information for tiles
*/

import type { TileData, Player } from "./types";

export type WordDirection = "horizontal" | "vertical";

export type ValidWord = {
    word: string;
    direction: WordDirection;
    tileIndices: number[]; // Board indices of tiles forming this word
    owner: Player; // Who owns this word (last to extend/create it)
};

export type TileHighlight = "none" | "horizontal" | "vertical" | "intersection" | "opponent-owned";

class WordValidator {
    private dictionary: Set<string> = $state(new Set());
    private isLoaded = $state(false);
    private validWords = $state<ValidWord[]>([]);
    private tileHighlights = $state<Map<number, TileHighlight>>(new Map());
    private previousWords = $state<ValidWord[]>([]); // Track words from previous validation

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
     * @param currentPlayer - The player who just made a move
     * @param cols - Number of columns (default 7)
     * @param rows - Number of rows (default 6)
     */
    validateBoard(
        board: Array<{ heldLetterTile: TileData | null }>,
        currentPlayer: Player,
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
                        tileIndices: indices,
                        owner: currentPlayer // Will be updated later based on previous state
                    });
                }

                // Right-to-left (reverse)
                if (word.length >= 2) {
                    const reversedWord = word.split("").reverse().join("");
                    if (this.isValidWord(reversedWord)) {
                        foundWords.push({
                            word: reversedWord,
                            direction: "horizontal",
                            tileIndices: [...indices].reverse(),
                            owner: currentPlayer // Will be updated later based on previous state
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
                        tileIndices: indices,
                        owner: currentPlayer // Will be updated later based on previous state
                    });
                }

                // Bottom-to-top (reverse)
                if (word.length >= 2) {
                    const reversedWord = word.split("").reverse().join("");
                    if (this.isValidWord(reversedWord)) {
                        foundWords.push({
                            word: reversedWord,
                            direction: "vertical",
                            tileIndices: [...indices].reverse(),
                            owner: currentPlayer // Will be updated later based on previous state
                        });
                    }
                }
            }
        }

        // Remove duplicate words (same indices)
        const uniqueWords = this.deduplicateWords(foundWords);

        // Determine ownership based on previous state
        const wordsWithOwnership = this.determineOwnership(uniqueWords, currentPlayer);

        // Update state
        this.previousWords = wordsWithOwnership; // Store for next validation
        this.validWords = wordsWithOwnership;
        this.updateHighlights(wordsWithOwnership);
    }

    /**
     * Determine ownership of words based on previous validation
     * A word's ownership changes to current player if:
     * - It's a new word (didn't exist before)
     * - It's been extended (same tiles plus more)
     */
    private determineOwnership(words: ValidWord[], currentPlayer: Player): ValidWord[] {
        return words.map(word => {
            // Create a key to identify this word by its tile positions
            const key = this.getWordKey(word);

            // Look for a matching word in previous validation
            const previousWord = this.previousWords.find(prev => {
                const prevKey = this.getWordKey(prev);
                // Check if this word is a subset or exact match of indices
                return this.isWordRelated(prev.tileIndices, word.tileIndices);
            });

            if (!previousWord) {
                // New word - current player owns it
                return { ...word, owner: currentPlayer };
            } else if (word.tileIndices.length > previousWord.tileIndices.length) {
                // Word was extended - current player now owns it
                return { ...word, owner: currentPlayer };
            } else if (this.arraysEqual(word.tileIndices, previousWord.tileIndices)) {
                // Same word, unchanged - keep previous owner
                return { ...word, owner: previousWord.owner };
            } else {
                // New word (different indices) - current player owns it
                return { ...word, owner: currentPlayer };
            }
        });
    }

    /**
     * Check if two words are related (one is extension of another)
     */
    private isWordRelated(prevIndices: number[], currentIndices: number[]): boolean {
        // Sort both arrays for comparison
        const prevSorted = [...prevIndices].sort((a, b) => a - b);
        const currentSorted = [...currentIndices].sort((a, b) => a - b);

        // Check if prevIndices is a subset of currentIndices
        if (prevIndices.length <= currentIndices.length) {
            return prevSorted.every(index => currentSorted.includes(index));
        }

        // Check if currentIndices is a subset of prevIndices
        return currentSorted.every(index => prevSorted.includes(index));
    }

    /**
     * Check if two arrays are equal
     */
    private arraysEqual(a: number[], b: number[]): boolean {
        if (a.length !== b.length) return false;
        const aSorted = [...a].sort((x, y) => x - y);
        const bSorted = [...b].sort((x, y) => x - y);
        return aSorted.every((val, i) => val === bSorted[i]);
    }

    /**
     * Get a unique key for a word based on its indices
     */
    private getWordKey(word: ValidWord): string {
        return word.tileIndices.slice().sort((a, b) => a - b).join(",");
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
     * For the current viewing player, tiles show blue/orange/purple for their owned words
     * and red for opponent-owned words
     */
    private updateHighlights(words: ValidWord[]) {
        this.tileHighlights = new Map();
    }

    /**
     * Get highlights for a specific player's perspective
     * Note: Only highlights UNCLAIMED tiles - claimed tiles are handled separately in the UI
     */
    getHighlightsForPlayer(player: Player, board: Array<{ heldLetterTile: TileData | null }>): Map<number, TileHighlight> {
        const highlights = new Map<number, TileHighlight>();

        for (const validWord of this.validWords) {
            for (const index of validWord.tileIndices) {
                // Skip tiles that are already claimed by anyone
                const tile = board[index]?.heldLetterTile;
                if (tile?.claimedBy !== null) {
                    continue;
                }

                const current = highlights.get(index);

                // If this word is owned by opponent, mark tile as opponent-owned
                if (validWord.owner !== player) {
                    if (!current || current === "none") {
                        highlights.set(index, "opponent-owned");
                    } else if (current !== "opponent-owned") {
                        // Keep opponent-owned if already set
                        highlights.set(index, "opponent-owned");
                    }
                } else {
                    // Word is owned by the player - show direction colors
                    if (!current || current === "none") {
                        // First time seeing this tile
                        highlights.set(index, validWord.direction);
                    } else if (current === "opponent-owned") {
                        // Keep opponent-owned (takes precedence)
                        highlights.set(index, "opponent-owned");
                    } else if (current !== validWord.direction && current !== "intersection") {
                        // Tile is part of both horizontal and vertical words
                        highlights.set(index, "intersection");
                    }
                    // If current === validWord.direction, keep it as is
                }
            }
        }

        return highlights;
    }

    /**
     * Get highlight type for a specific board tile from player's perspective
     */
    getHighlight(boardIndex: number, viewingPlayer: Player, board: Array<{ heldLetterTile: TileData | null }>): TileHighlight {
        const highlights = this.getHighlightsForPlayer(viewingPlayer, board);
        return highlights.get(boardIndex) ?? "none";
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
