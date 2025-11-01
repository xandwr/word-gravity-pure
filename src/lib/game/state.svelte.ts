/*
    $lib/game/state.svelte.ts
*/

import { nanoid } from "nanoid";
import type { TileData, TileContainer } from "./types";
import { playerBag } from "./playerLetterBag.svelte";
import { opponentBag } from "./opponentLetterBag.svelte";

export function createTile(letter: string, baseScore: number): TileData {
    return {
        id: nanoid(),
        letter,
        baseScore,
        multiplier: 1
    };
}

// Constants for game layout
const GRID_COLS = 7;
const GRID_ROWS = 6;
const HAND_SIZE = 8;

// Create the reactive game state using runes
function createGameState() {
    // Board grid - 7 cols x 6 rows = 42 slots
    const boardSlots = $state<TileContainer[]>(
        Array.from({ length: GRID_COLS * GRID_ROWS }, () => ({
            heldLetterTile: null
        }))
    );

    // Player hand - 8 slots
    const handSlots = $state<TileContainer[]>(
        Array.from({ length: HAND_SIZE }, () => ({
            heldLetterTile: null
        }))
    );

    // Game metadata
    const playerScore = $state({ value: 0 });
    const opponentScore = $state({ value: 0 });
    const swapsRemaining = $state({ value: 5 });

    return {
        // Readonly access to board slots
        get board() {
            return boardSlots;
        },

        // Readonly access to hand slots
        get hand() {
            return handSlots;
        },

        // Player bag
        get playerBag() {
            return playerBag;
        },

        // Opponent's bag
        get opponentBag() {
            return opponentBag;
        },

        // Readonly access to scores
        get playerScore() {
            return playerScore.value;
        },

        get opponentScore() {
            return opponentScore.value;
        },

        get swapsRemaining() {
            return swapsRemaining.value;
        },

        // Methods to update the state
        setBoardSlot(index: number, tile: TileData | null) {
            if (index >= 0 && index < boardSlots.length) {
                boardSlots[index].heldLetterTile = tile;
            }
        },

        setHandSlot(index: number, tile: TileData | null) {
            if (index >= 0 && index < handSlots.length) {
                handSlots[index].heldLetterTile = tile;
            }
        },

        updatePlayerScore(score: number) {
            playerScore.value = score;
        },

        updateOpponentScore(score: number) {
            opponentScore.value = score;
        },

        decrementSwaps() {
            if (swapsRemaining.value > 0) {
                swapsRemaining.value--;
            }
        },

        // Utility method to get a tile from board
        getBoardTile(index: number): TileData | null {
            return boardSlots[index]?.heldLetterTile ?? null;
        },

        // Utility method to get a tile from hand
        getHandTile(index: number): TileData | null {
            return handSlots[index]?.heldLetterTile ?? null;
        }
    };
}

// Export a singleton instance of the game state
export const gameState = createGameState();

// Export constants
export const BOARD_CONFIG = {
    COLS: GRID_COLS,
    ROWS: GRID_ROWS,
    TOTAL_SLOTS: GRID_COLS * GRID_ROWS
} as const;

export const HAND_CONFIG = {
    SIZE: HAND_SIZE
} as const;