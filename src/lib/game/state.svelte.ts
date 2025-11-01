/*
    $lib/game/state.svelte.ts
*/

import { nanoid } from "nanoid";
import type { TileData, TileContainer } from "./types";
import { playerBag } from "./playerLetterBag.svelte";
import { opponentBag } from "./opponentLetterBag.svelte";
import { drawFromBag } from "./letterBag.svelte";

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
    const playerHandSlots = $state<TileContainer[]>(
        Array.from({ length: HAND_SIZE }, () => ({
            heldLetterTile: null
        }))
    );

    // Opponent hand - 8 slots
    const opponentHandSlots = $state<TileContainer[]>(
        Array.from({ length: HAND_SIZE }, () => ({
            heldLetterTile: null
        }))
    );

    // Game metadata
    const playerScore = $state({ value: 0 });
    const opponentScore = $state({ value: 0 });

    const currentPlayerTurn = $state<{ value: "player" | "opponent" }>({ value: "player" });

    const playerSwapsRemaining = $state({ value: 5 });

    // Drag state - tracks what tile is being dragged and from where
    const dragState = $state<{
        tile: TileData | null;
        sourceType: "hand" | "board" | null;
        sourceIndex: number | null;
    }>({
        tile: null,
        sourceType: null,
        sourceIndex: null
    });

    return {
        // Readonly access to board slots
        get board() {
            return boardSlots;
        },

        get playerHandSlots() {
            return playerHandSlots;
        },

        get opponentHandSlots() {
            return opponentHandSlots;
        },

        get currentPlayerTurn() {
            return currentPlayerTurn.value;
        },

        // Readonly access to hand slots
        get playerHand() {
            return;
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

        get playerSwapsRemaining() {
            return playerSwapsRemaining.value;
        },

        // Methods to update the state
        setBoardSlot(index: number, tile: TileData | null) {
            if (index >= 0 && index < boardSlots.length) {
                boardSlots[index].heldLetterTile = tile;
            }
        },

        setPlayerHandSlot(index: number, tile: TileData | null) {
            if (index >= 0 && index < playerHandSlots.length) {
                playerHandSlots[index].heldLetterTile = tile;
            }
        },

        setOpponentHandSlot(index: number, tile: TileData | null) {
            if (index >= 0 && index < opponentHandSlots.length) {
                opponentHandSlots[index].heldLetterTile = tile;
            }
        },

        playerDrawTile(): TileData | null {
            const tile = drawFromBag(playerBag, 1)[0];
            return tile;
        },

        opponentDrawTile(): TileData | null {
            const tile = drawFromBag(opponentBag, 1)[0];
            return tile;
        },

        playerFreshHand(): TileData[] | null {
            const hand = drawFromBag(playerBag, 8);
            return hand;
        },

        opponentFreshHand(): TileData[] | null {
            const hand = drawFromBag(opponentBag, 8);
            return hand;
        },

        updatePlayerScore(score: number) {
            playerScore.value = score;
        },

        updateOpponentScore(score: number) {
            opponentScore.value = score;
        },

        decrementPlayerSwaps() {
            if (playerSwapsRemaining.value > 0) {
                playerSwapsRemaining.value--;
            }
        },

        // Utility method to get a tile from board
        getBoardTile(index: number): TileData | null {
            return boardSlots[index]?.heldLetterTile ?? null;
        },

        // Utility method to get a tile from hand
        getPlayerHandTile(index: number): TileData | null {
            return playerHandSlots[index]?.heldLetterTile ?? null;
        },

        getOpponentHandTile(index: number): TileData | null {
            return opponentHandSlots[index]?.heldLetterTile ?? null;
        },

        // Drag and drop methods
        startDrag(tile: TileData, sourceType: "hand" | "board", sourceIndex: number) {
            dragState.tile = tile;
            dragState.sourceType = sourceType;
            dragState.sourceIndex = sourceIndex;
        },

        endDrag() {
            dragState.tile = null;
            dragState.sourceType = null;
            dragState.sourceIndex = null;
        },

        getDragState() {
            return dragState;
        },

        // Move tile from hand to board
        moveFromHandToBoard(handIndex: number, boardIndex: number) {
            const tile = this.getPlayerHandTile(handIndex);
            if (tile && this.getBoardTile(boardIndex) === null) {
                this.setBoardSlot(boardIndex, tile);
                this.setPlayerHandSlot(handIndex, null);
                return true;
            }
            return false;
        },

        // Move tile from board back to hand
        moveFromBoardToHand(boardIndex: number, handIndex: number) {
            const tile = this.getBoardTile(boardIndex);
            if (tile && this.getPlayerHandTile(handIndex) === null) {
                this.setPlayerHandSlot(handIndex, tile);
                this.setBoardSlot(boardIndex, null);
                return true;
            }
            return false;
        },

        // Turn management
        switchTurn() {
            currentPlayerTurn.value = currentPlayerTurn.value === "player" ? "opponent" : "player";
        },

        endPlayerTurn() {
            if (currentPlayerTurn.value === "player") {
                this.switchTurn();
                // Trigger opponent turn after a brief delay
                setTimeout(() => {
                    this.makeOpponentMove();
                }, 500);
            }
        },

        // AI opponent logic
        makeOpponentMove() {
            if (currentPlayerTurn.value !== "opponent") return;

            // Find a non-null tile from opponent's hand
            let handIndex = -1;
            for (let i = 0; i < opponentHandSlots.length; i++) {
                if (opponentHandSlots[i].heldLetterTile !== null) {
                    handIndex = i;
                    break;
                }
            }

            if (handIndex === -1) {
                // No tiles in hand, end turn
                this.switchTurn();
                return;
            }

            // Pick a random column (0 to GRID_COLS - 1)
            const randomCol = Math.floor(Math.random() * GRID_COLS);
            // Place at top row of that column (row 0)
            const boardIndex = randomCol; // Top row index = column index

            // Check if the top slot of that column is empty
            if (this.getBoardTile(boardIndex) === null) {
                const tile = opponentHandSlots[handIndex].heldLetterTile;
                if (tile) {
                    this.setBoardSlot(boardIndex, tile);
                    this.setOpponentHandSlot(handIndex, null);
                }
            }

            // End opponent turn
            this.switchTurn();
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