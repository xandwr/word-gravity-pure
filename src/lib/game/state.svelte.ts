/*
    $lib/game/state.svelte.ts
*/

import { nanoid } from "nanoid";
import type { TileData, TileContainer } from "./types";
import { playerBag } from "./playerLetterBag.svelte";
import { opponentBag } from "./opponentLetterBag.svelte";
import { drawFromBag } from "./letterBag.svelte";
import { wordValidator } from "./wordValidator.svelte";

export function createTile(letter: string, baseScore: number): TileData {
    return {
        id: nanoid(),
        letter,
        baseScore,
        multiplier: 1,
        claimedBy: null
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

    // Gravity interval ID for cleanup
    let gravityIntervalId: number | null = null;

    // Board settlement tracking
    const isBoardSettled = $state({ value: true });
    const pendingTurnSwitch = $state({ value: false });

    // Claiming animation state
    const isClaimingInProgress = $state({ value: false });
    const claimingWaves = $state<number[][]>([]); // Array of arrays, each inner array is a wave of tile indices

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

        get boardSettled() {
            return isBoardSettled.value;
        },

        get isClaimingActive() {
            return isClaimingInProgress.value;
        },

        get currentClaimingWaves() {
            return claimingWaves;
        },

        // Access to word validator
        get validator() {
            return wordValidator;
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

        // Swap a tile from player's hand
        swapPlayerTile(handIndex: number): boolean {
            if (playerSwapsRemaining.value <= 0) {
                return false;
            }

            const oldTile = this.getPlayerHandTile(handIndex);
            if (!oldTile) {
                return false;
            }

            // Put the old tile back in the bag
            playerBag.push(oldTile);

            // Draw a new tile from the bag
            const newTile = this.playerDrawTile();
            if (newTile) {
                this.setPlayerHandSlot(handIndex, newTile);
            } else {
                // If no tiles available, just clear the slot
                this.setPlayerHandSlot(handIndex, null);
            }

            // Decrement swaps and end turn
            this.decrementPlayerSwaps();
            this.endPlayerTurn();

            return true;
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
                // Mark board as unsettled when placing a tile
                isBoardSettled.value = false;
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
            // Only switch turns if board has settled
            if (isBoardSettled.value) {
                this.executeTurnSwitch();
            } else {
                // Mark that we want to switch turns once board settles
                pendingTurnSwitch.value = true;
            }
        },

        executeTurnSwitch() {
            currentPlayerTurn.value = currentPlayerTurn.value === "player" ? "opponent" : "player";

            // If switching to opponent, trigger their move after a brief delay
            if (currentPlayerTurn.value === "opponent") {
                setTimeout(() => {
                    this.makeOpponentMove();
                }, 500);
            }
        },

        endPlayerTurn() {
            if (currentPlayerTurn.value === "player") {
                this.switchTurn();
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
                    // Mark board as unsettled when placing a tile
                    isBoardSettled.value = false;
                }
            }

            // End opponent turn (will wait for board to settle)
            this.switchTurn();
        },

        // Tile claiming system
        /**
         * Attempt to claim tiles starting from a clicked board position
         * Uses flood fill to find all contiguous tiles that are part of player-owned words
         */
        claimTilesFrom(boardIndex: number) {
            // Can't claim during settling, claiming, or if not player's turn
            if (!isBoardSettled.value || isClaimingInProgress.value || currentPlayerTurn.value !== "player") {
                return;
            }

            const tile = this.getBoardTile(boardIndex);
            if (!tile || tile.claimedBy !== null) {
                return; // No tile or already claimed
            }

            // Check if this tile is part of a player-owned word
            const playerOwnedIndices = this.getPlayerOwnedTileIndices();
            if (!playerOwnedIndices.has(boardIndex)) {
                return; // Not part of a player-owned word
            }

            // Perform BFS flood fill to find all contiguous player-owned unclaimed tiles
            const waves = this.floodFillClaim(boardIndex, playerOwnedIndices);

            if (waves.length === 0) {
                return; // Nothing to claim
            }

            // Start the claiming animation
            isClaimingInProgress.value = true;
            this.animateClaimingWaves(waves);
        },

        /**
         * Get all board indices that contain tiles part of player-owned words
         */
        getPlayerOwnedTileIndices(): Set<number> {
            const indices = new Set<number>();
            const validWords = wordValidator.words;

            for (const word of validWords) {
                if (word.owner === "player") {
                    for (const index of word.tileIndices) {
                        indices.add(index);
                    }
                }
            }

            return indices;
        },

        /**
         * BFS flood fill to find contiguous player-owned unclaimed tiles
         * Returns array of waves (each wave is an array of tile indices at the same distance)
         */
        floodFillClaim(startIndex: number, playerOwnedIndices: Set<number>): number[][] {
            const visited = new Set<number>();
            const waves: number[][] = [];
            let currentWave = [startIndex];
            visited.add(startIndex);

            while (currentWave.length > 0) {
                const nextWave: number[] = [];
                waves.push([...currentWave]);

                for (const index of currentWave) {
                    // Get adjacent indices (up, down, left, right)
                    const adjacent = this.getAdjacentIndices(index);

                    for (const adjIndex of adjacent) {
                        if (visited.has(adjIndex)) continue;

                        const tile = this.getBoardTile(adjIndex);
                        // Include if: has tile, unclaimed, and part of player-owned word
                        if (tile && tile.claimedBy === null && playerOwnedIndices.has(adjIndex)) {
                            visited.add(adjIndex);
                            nextWave.push(adjIndex);
                        }
                    }
                }

                currentWave = nextWave;
            }

            return waves;
        },

        /**
         * Get adjacent board indices (up, down, left, right)
         */
        getAdjacentIndices(index: number): number[] {
            const row = Math.floor(index / GRID_COLS);
            const col = index % GRID_COLS;
            const adjacent: number[] = [];

            // Up
            if (row > 0) adjacent.push((row - 1) * GRID_COLS + col);
            // Down
            if (row < GRID_ROWS - 1) adjacent.push((row + 1) * GRID_COLS + col);
            // Left
            if (col > 0) adjacent.push(row * GRID_COLS + (col - 1));
            // Right
            if (col < GRID_COLS - 1) adjacent.push(row * GRID_COLS + (col + 1));

            return adjacent;
        },

        /**
         * Animate claiming waves with sequential delays
         */
        async animateClaimingWaves(waves: number[][]) {
            const WAVE_DELAY = 150; // ms between waves

            for (let i = 0; i < waves.length; i++) {
                const wave = waves[i];

                // Claim all tiles in this wave
                for (const index of wave) {
                    const tile = boardSlots[index].heldLetterTile;
                    if (tile && tile.claimedBy === null) {
                        tile.claimedBy = "player";
                    }
                }

                // Store current wave for visual feedback
                claimingWaves[0] = wave;

                // Wait before next wave
                if (i < waves.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, WAVE_DELAY));
                }
            }

            // Clear waves and end claiming
            await new Promise(resolve => setTimeout(resolve, WAVE_DELAY));
            claimingWaves.length = 0;
            isClaimingInProgress.value = false;
        },

        // Gravity system - moves tiles down one cell at a time
        applyGravity() {
            let moved = false;

            // Start from the second-to-last row and work upwards
            // (bottom row can't fall further)
            for (let row = GRID_ROWS - 2; row >= 0; row--) {
                for (let col = 0; col < GRID_COLS; col++) {
                    const currentIndex = row * GRID_COLS + col;
                    const belowIndex = (row + 1) * GRID_COLS + col; // i + GRID_COLS

                    const currentTile = boardSlots[currentIndex].heldLetterTile;
                    const belowTile = boardSlots[belowIndex].heldLetterTile;

                    // If current slot has a tile and slot below is empty
                    if (currentTile !== null && belowTile === null) {
                        // Move tile down one slot
                        boardSlots[belowIndex].heldLetterTile = currentTile;
                        boardSlots[currentIndex].heldLetterTile = null;
                        moved = true;
                    }
                }
            }

            // If nothing moved, board has settled
            if (!moved && !isBoardSettled.value) {
                isBoardSettled.value = true;
                this.onBoardSettled();
            } else if (moved) {
                isBoardSettled.value = false;
            }

            return moved;
        },

        // Called when the board settles after gravity
        onBoardSettled() {
            // Validate the board and find all valid words
            // Pass the player who just made a move (before turn switch)
            wordValidator.validateBoard(boardSlots, currentPlayerTurn.value, GRID_COLS, GRID_ROWS);

            // If there's a pending turn switch, execute it now
            if (pendingTurnSwitch.value) {
                pendingTurnSwitch.value = false;
                this.executeTurnSwitch();
            }
        },

        // Start the gravity tick system
        startGravity(intervalMs = 500) {
            if (gravityIntervalId !== null) {
                return; // Already running
            }

            gravityIntervalId = window.setInterval(() => {
                this.applyGravity();
            }, intervalMs);
        },

        // Stop the gravity tick system
        stopGravity() {
            if (gravityIntervalId !== null) {
                clearInterval(gravityIntervalId);
                gravityIntervalId = null;
            }
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