/*
    $lib/game/state.svelte.ts
*/

import type { TileData, TileContainer } from "./types";
import { sharedBag } from "./sharedLetterBag.svelte";
import { drawFromBag, createTile } from "./letterBag.svelte";
import { wordValidator } from "./wordValidator.svelte";
import { AI_CONFIG, AI_DIFFICULTY } from "./constants";
import { findBestAction } from "./aiStrategy.svelte";

// Re-export createTile for backwards compatibility
export { createTile } from "./letterBag.svelte";

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

    // Game over state
    const isGameOver = $state({ value: false });
    const gameOverReason = $state<{ value: string | null }>({ value: null });

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

    // Background shader controls
    const bgOpacity = $state({ value: 0.5 });
    const bgFlashColor = $state<{ value: [number, number, number] }>({ value: [0.0, 0.0, 0.0] });
    const bgFlashIntensity = $state({ value: 0.0 });
    const bgContrastMod = $state({ value: 1.0 });
    const bgSpinMod = $state({ value: 1.0 });

    // AI difficulty setting
    const aiDifficulty = $state<{ value: 'EASY' | 'MEDIUM' | 'HARD' | 'NIGHTMARE' }>({ value: 'EASY' });

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

        // Shared bag (both players draw from this)
        get sharedBag() {
            return sharedBag;
        },

        // Reactive bag count getter
        get bagCount() {
            return sharedBag.length;
        },

        // Background shader opacity
        get backgroundOpacity() {
            return bgOpacity.value;
        },

        // Background shader flash color (RGB 0.0-1.0)
        get backgroundFlashColor() {
            return bgFlashColor.value;
        },

        // Background shader flash intensity (0.0-1.0)
        get backgroundFlashIntensity() {
            return bgFlashIntensity.value;
        },

        // Background shader contrast modifier (0.0-2.0, default 1.0)
        get backgroundContrastMod() {
            return bgContrastMod.value;
        },

        // Background shader spin modifier (0.0-2.0, default 1.0)
        get backgroundSpinMod() {
            return bgSpinMod.value;
        },

        // Trigger a color flash on the background shader
        triggerBackgroundFlash(color: [number, number, number], duration: number = 600) {
            // Set the flash color and intensity
            bgFlashColor.value = color;

            const startTime = performance.now();
            const rampUpTime = 0.15; // 15% of duration for gradual burst
            const peakIntensity = 0.35; // Reduced from 0.7 for more subtle effect
            let lastTime = startTime;

            const animate = (currentTime: number) => {
                const delta = (currentTime - lastTime) / 1000; // Delta in seconds
                lastTime = currentTime;

                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1.0);

                let intensity: number;
                if (progress < rampUpTime) {
                    // Gradual ramp up (quadratic ease-in for smoother start)
                    const rampProgress = progress / rampUpTime;
                    const eased = rampProgress * rampProgress;
                    intensity = peakIntensity * eased;
                } else {
                    // Smooth quartic decay (slower falloff)
                    const decayProgress = (progress - rampUpTime) / (1 - rampUpTime);
                    const eased = 1 - Math.pow(decayProgress, 4.0);
                    intensity = peakIntensity * eased;
                }

                // Lerp the intensity based on delta time for frame-rate independence
                const lerpFactor = Math.min(delta * 60, 1.0); // Normalize to 60fps
                bgFlashIntensity.value = bgFlashIntensity.value + (intensity - bgFlashIntensity.value) * lerpFactor;

                if (progress < 1.0) {
                    requestAnimationFrame(animate);
                } else {
                    bgFlashIntensity.value = 0.0;
                }
            };
            requestAnimationFrame(animate);
        },

        // Pulse the contrast modifier
        pulseContrast(targetMod: number = 1.4, duration: number = 1200) {
            const startValue = bgContrastMod.value;
            const startTime = performance.now();
            const rampUpTime = 0.2; // 20% of duration for gradual ramp up
            let lastTime = startTime;

            const animate = (currentTime: number) => {
                const delta = (currentTime - lastTime) / 1000; // Delta in seconds
                lastTime = currentTime;

                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1.0);

                let targetValue: number;
                if (progress < rampUpTime) {
                    // Gradual ramp up using quadratic ease-in
                    const rampProgress = progress / rampUpTime;
                    const eased = rampProgress * rampProgress;
                    targetValue = startValue + (targetMod - startValue) * eased;
                } else {
                    // Smooth quartic decay back to normal
                    const decayProgress = (progress - rampUpTime) / (1 - rampUpTime);
                    const eased = 1 - Math.pow(decayProgress, 4.0);
                    targetValue = startValue + (targetMod - startValue) * eased;
                }

                // Lerp the value based on delta time for frame-rate independence
                const lerpFactor = Math.min(delta * 60, 1.0); // Normalize to 60fps
                bgContrastMod.value = bgContrastMod.value + (targetValue - bgContrastMod.value) * lerpFactor;

                if (progress < 1.0) {
                    requestAnimationFrame(animate);
                } else {
                    bgContrastMod.value = startValue;
                }
            };
            requestAnimationFrame(animate);
        },

        // Pulse the spin speed modifier
        pulseSpin(targetMod: number = 1.6, duration: number = 1400) {
            const startValue = bgSpinMod.value;
            const startTime = performance.now();
            const rampUpTime = 0.2; // 20% of duration for gradual ramp up
            let lastTime = startTime;

            const animate = (currentTime: number) => {
                const delta = (currentTime - lastTime) / 1000; // Delta in seconds
                lastTime = currentTime;

                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1.0);

                let targetValue: number;
                if (progress < rampUpTime) {
                    // Gradual ramp up using quadratic ease-in
                    const rampProgress = progress / rampUpTime;
                    const eased = rampProgress * rampProgress;
                    targetValue = startValue + (targetMod - startValue) * eased;
                } else {
                    // Smooth quartic decay back to normal
                    const decayProgress = (progress - rampUpTime) / (1 - rampUpTime);
                    const eased = 1 - Math.pow(decayProgress, 4.0);
                    targetValue = startValue + (targetMod - startValue) * eased;
                }

                // Lerp the value based on delta time for frame-rate independence
                const lerpFactor = Math.min(delta * 60, 1.0); // Normalize to 60fps
                bgSpinMod.value = bgSpinMod.value + (targetValue - bgSpinMod.value) * lerpFactor;

                if (progress < 1.0) {
                    requestAnimationFrame(animate);
                } else {
                    bgSpinMod.value = startValue;
                }
            };
            requestAnimationFrame(animate);
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

        get isGameOver() {
            return isGameOver.value;
        },

        get gameOverReason() {
            return gameOverReason.value;
        },

        // AI difficulty
        get aiDifficulty() {
            return aiDifficulty.value;
        },

        setAiDifficulty(difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'NIGHTMARE') {
            aiDifficulty.value = difficulty;
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
            const tile = drawFromBag(sharedBag, 1)[0];
            return tile;
        },

        opponentDrawTile(): TileData | null {
            const tile = drawFromBag(sharedBag, 1)[0];
            return tile;
        },

        playerFreshHand(): TileData[] | null {
            const hand = drawFromBag(sharedBag, 8);
            return hand;
        },

        opponentFreshHand(): TileData[] | null {
            const hand = drawFromBag(sharedBag, 8);
            return hand;
        },

        updatePlayerScore(score: number) {
            const oldScore = playerScore.value;
            playerScore.value = score;

            // Trigger shader effects if score increased
            if (score > oldScore) {
                // Convert player color from hex to RGB 0.0-1.0
                const color = this.hexToRGB('#22c55e'); // green-500
                this.triggerBackgroundFlash(color, 1000); // Increased duration for smoother effect
                this.pulseContrast(1.2, 800); // Reduced from 1.3, shorter duration
                this.pulseSpin(1.25, 1200); // Reduced from 1.4, shorter duration
            }
        },

        updateOpponentScore(score: number) {
            const oldScore = opponentScore.value;
            opponentScore.value = score;

            // Trigger shader effects if score increased
            if (score > oldScore) {
                // Convert opponent color from hex to RGB 0.0-1.0
                const color = this.hexToRGB('#ef4444'); // red-500
                this.triggerBackgroundFlash(color, 1000); // Increased duration for smoother effect
                this.pulseContrast(1.2, 800); // Reduced from 1.3, shorter duration
                this.pulseSpin(1.25, 1200); // Reduced from 1.4, shorter duration
            }
        },

        // Helper to convert hex color to RGB 0.0-1.0
        hexToRGB(hex: string): [number, number, number] {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return [r, g, b];
        },

        decrementPlayerSwaps() {
            if (playerSwapsRemaining.value > 0) {
                playerSwapsRemaining.value--;
            }
        },

        incrementPlayerSwaps() {
            playerSwapsRemaining.value++;
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

            // Put the old tile back in the shared bag
            sharedBag.push(oldTile);

            // Draw a new tile from the bag
            const newTile = this.playerDrawTile();
            if (newTile) {
                this.setPlayerHandSlot(handIndex, newTile);
            } else {
                // If no tiles available, just clear the slot
                this.setPlayerHandSlot(handIndex, null);
            }

            // Decrement swaps (no longer ends turn)
            this.decrementPlayerSwaps();

            return true;
        },

        // Swap a tile from player's hand with a specific tile from the bag
        swapPlayerTileWithSpecific(handIndex: number, bagIndex: number): boolean {
            if (playerSwapsRemaining.value <= 0) {
                return false;
            }

            const oldTile = this.getPlayerHandTile(handIndex);
            if (!oldTile) {
                return false;
            }

            // Check if bag index is valid
            if (bagIndex < 0 || bagIndex >= sharedBag.length) {
                return false;
            }

            // Get the specific tile from the bag
            const newTile = sharedBag.splice(bagIndex, 1)[0];

            // Put the old tile back in the shared bag
            sharedBag.push(oldTile);

            // Set the new tile in the hand
            this.setPlayerHandSlot(handIndex, newTile);

            // Decrement swaps
            this.decrementPlayerSwaps();

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

                // Don't draw replacement tile yet - tile may be claimed and returned to bag
                // Replacement tiles will be drawn at end of turn instead

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

        // AI opponent logic - Intelligent strategic decision-making
        makeOpponentMove() {
            if (currentPlayerTurn.value !== "opponent") return;

            // Get player and opponent owned tile indices
            const playerOwnedIndices = this.getPlayerOwnedTileIndices();
            const opponentOwnedIndices = this.getOpponentOwnedTileIndices();

            // Get aggressiveness from current difficulty setting
            const aggressiveness = AI_DIFFICULTY[aiDifficulty.value].AGGRESSIVENESS;

            // Use intelligent AI to find best action
            const bestAction = findBestAction(
                boardSlots,
                opponentHandSlots,
                playerOwnedIndices,
                opponentOwnedIndices,
                aggressiveness,
                AI_CONFIG.DEBUG_LOGGING
            );

            if (!bestAction) {
                // No valid actions, end turn
                if (AI_CONFIG.DEBUG_LOGGING) {
                    console.log("[AI] No valid actions available");
                }
                this.switchTurn();
                return;
            }

            // Log AI decision
            if (AI_CONFIG.DEBUG_LOGGING) {
                console.log(`[AI] Best action: ${bestAction.type} (score: ${bestAction.score.toFixed(1)})`);
                if (bestAction.type === "place" && bestAction.placement) {
                    console.log(`[AI] Placement reasoning:`, bestAction.placement.reasoning);
                } else if (bestAction.type === "claim" && bestAction.claim) {
                    console.log(`[AI] Claim reasoning:`, bestAction.claim.reasoning);
                }
            }

            // Execute the chosen action
            if (bestAction.type === "claim" && bestAction.claim) {
                // Claim tiles
                this.claimTilesFromOpponent(bestAction.claim.boardIndex);

                // If claiming started, the animation will handle ending the turn
                if (isClaimingInProgress.value) {
                    return;
                }
            } else if (bestAction.type === "place" && bestAction.placement) {
                // Place tile
                const { handIndex, column } = bestAction.placement;
                const tile = opponentHandSlots[handIndex].heldLetterTile;

                if (tile) {
                    const boardIndex = column; // Top row index = column index

                    // Check if the top slot of that column is empty
                    if (this.getBoardTile(boardIndex) === null) {
                        this.setBoardSlot(boardIndex, tile);
                        this.setOpponentHandSlot(handIndex, null);

                        // Don't draw replacement tile yet - tile may be claimed and returned to bag
                        // Replacement tiles will be drawn at end of turn instead

                        // Mark board as unsettled when placing a tile
                        isBoardSettled.value = false;
                    }
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
         * Get all board indices that contain tiles part of opponent-owned words
         */
        getOpponentOwnedTileIndices(): Set<number> {
            const indices = new Set<number>();
            const validWords = wordValidator.words;

            for (const word of validWords) {
                if (word.owner === "opponent") {
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
         * Scores and fades out tiles immediately as each wave is processed
         */
        async animateClaimingWaves(waves: number[][]) {
            const WAVE_DELAY = 150; // ms between waves
            const FADE_DELAY = 400; // ms to wait before starting fade (matches letterTile)
            const FADE_DURATION = 300; // ms for fade out animation

            // Trigger shader effects once at the start
            const color = this.hexToRGB('#22c55e'); // green-500
            this.triggerBackgroundFlash(color, 1000); // Smoother, longer effect
            this.pulseContrast(1.2, 800); // More subtle contrast pulse

            for (let i = 0; i < waves.length; i++) {
                const wave = waves[i];

                // Process each tile in this wave
                for (const index of wave) {
                    const tile = boardSlots[index].heldLetterTile;
                    if (tile && tile.claimedBy === null) {
                        // Claim and mark for fading
                        tile.claimedBy = "player";
                        tile.fadingOut = true;
                        tile.fadeStartTime = Date.now();

                        // Score immediately
                        const tileScore = tile.baseScore * tile.multiplier;
                        playerScore.value += tileScore;
                    }
                }

                // Store current wave for visual feedback (pulsing effect)
                claimingWaves[0] = wave;

                // Wait before next wave
                await new Promise(resolve => setTimeout(resolve, WAVE_DELAY));
            }

            // Clear waves
            claimingWaves.length = 0;

            // Wait for fade delay + fade duration to complete, then clean up tiles
            await new Promise(resolve => setTimeout(resolve, FADE_DELAY + FADE_DURATION));

            // Destroy all faded tiles (no longer return to bag)
            for (let i = 0; i < boardSlots.length; i++) {
                const tile = boardSlots[i].heldLetterTile;
                if (tile && tile.fadingOut) {
                    // Tiles are destroyed - just remove from board
                    boardSlots[i].heldLetterTile = null;
                }
            }

            // Mark board as unsettled to trigger gravity
            isBoardSettled.value = false;

            // Award a swap for claiming a valid word
            this.incrementPlayerSwaps();

            isClaimingInProgress.value = false;
        },

        /**
         * Opponent claims tiles starting from a board position
         * Similar to claimTilesFrom but for the opponent
         */
        claimTilesFromOpponent(boardIndex: number) {
            // Can't claim during settling or if claiming in progress
            if (!isBoardSettled.value || isClaimingInProgress.value) {
                return;
            }

            const tile = this.getBoardTile(boardIndex);
            if (!tile || tile.claimedBy !== null) {
                return; // No tile or already claimed
            }

            // Check if this tile is part of an opponent-owned word
            const opponentOwnedIndices = this.getOpponentOwnedTileIndices();
            if (!opponentOwnedIndices.has(boardIndex)) {
                return; // Not part of an opponent-owned word
            }

            // Perform BFS flood fill to find all contiguous opponent-owned unclaimed tiles
            const waves = this.floodFillClaim(boardIndex, opponentOwnedIndices);

            if (waves.length === 0) {
                return; // Nothing to claim
            }

            // Start the claiming animation for opponent
            isClaimingInProgress.value = true;
            this.animateOpponentClaimingWaves(waves);
        },

        /**
         * Animate opponent claiming waves with sequential delays
         * Scores and fades out tiles immediately as each wave is processed
         */
        async animateOpponentClaimingWaves(waves: number[][]) {
            const WAVE_DELAY = 150; // ms between waves
            const FADE_DELAY = 400; // ms to wait before starting fade (matches letterTile)
            const FADE_DURATION = 300; // ms for fade out animation

            // Trigger shader effects once at the start
            const color = this.hexToRGB('#ef4444'); // red-500
            this.triggerBackgroundFlash(color, 1000); // Smoother, longer effect
            this.pulseContrast(1.2, 800); // More subtle contrast pulse

            for (let i = 0; i < waves.length; i++) {
                const wave = waves[i];

                // Process each tile in this wave
                for (const index of wave) {
                    const tile = boardSlots[index].heldLetterTile;
                    if (tile && tile.claimedBy === null) {
                        // Claim and mark for fading
                        tile.claimedBy = "opponent";
                        tile.fadingOut = true;
                        tile.fadeStartTime = Date.now();

                        // Score immediately for opponent
                        const tileScore = tile.baseScore * tile.multiplier;
                        opponentScore.value += tileScore;
                    }
                }

                // Store current wave for visual feedback (pulsing effect)
                claimingWaves[0] = wave;

                // Wait before next wave
                await new Promise(resolve => setTimeout(resolve, WAVE_DELAY));
            }

            // Clear waves
            claimingWaves.length = 0;

            // Wait for fade delay + fade duration to complete, then clean up tiles
            await new Promise(resolve => setTimeout(resolve, FADE_DELAY + FADE_DURATION));

            // Destroy all faded tiles (no longer return to bag)
            for (let i = 0; i < boardSlots.length; i++) {
                const tile = boardSlots[i].heldLetterTile;
                if (tile && tile.fadingOut) {
                    // Tiles are destroyed - just remove from board
                    boardSlots[i].heldLetterTile = null;
                }
            }

            // Mark board as unsettled to trigger gravity
            isBoardSettled.value = false;

            isClaimingInProgress.value = false;

            // Switch turn back to player after opponent claims
            this.switchTurn();
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
                        // Mark tile as moving (reset landing flag)
                        currentTile.hasLanded = false;

                        // Move tile down one slot
                        boardSlots[belowIndex].heldLetterTile = currentTile;
                        boardSlots[currentIndex].heldLetterTile = null;
                        moved = true;
                    }
                    // If current tile exists and can't move down (landed)
                    else if (currentTile !== null && belowTile !== null && !currentTile.hasLanded) {
                        // Tile has just landed - apply +1 multiplier to all tiles below
                        currentTile.hasLanded = true;

                        for (let belowRow = row + 1; belowRow < GRID_ROWS; belowRow++) {
                            const belowIdx = belowRow * GRID_COLS + col;
                            const tileBelow = boardSlots[belowIdx].heldLetterTile;
                            if (tileBelow !== null) {
                                tileBelow.multiplier += 1;
                            }
                        }
                    }
                }
            }

            // Handle bottom row tiles (they land on the floor)
            for (let col = 0; col < GRID_COLS; col++) {
                const bottomIndex = (GRID_ROWS - 1) * GRID_COLS + col;
                const bottomTile = boardSlots[bottomIndex].heldLetterTile;

                if (bottomTile !== null && !bottomTile.hasLanded) {
                    bottomTile.hasLanded = true;
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
            // Refill the current player's hand before switching turns
            this.refillCurrentPlayerHand();

            // Validate the board and find all valid words
            // Pass the player who just made a move (before turn switch)
            wordValidator.validateBoard(boardSlots, currentPlayerTurn.value, GRID_COLS, GRID_ROWS);

            // Check for game over condition
            this.checkGameOver();

            // If there's a pending turn switch, execute it now
            if (pendingTurnSwitch.value) {
                pendingTurnSwitch.value = false;
                this.executeTurnSwitch();
            }
        },

        // Refill the current player's hand with tiles from their bag
        refillCurrentPlayerHand() {
            if (currentPlayerTurn.value === "player") {
                // Fill empty slots in player's hand
                for (let i = 0; i < playerHandSlots.length; i++) {
                    if (playerHandSlots[i].heldLetterTile === null) {
                        const newTile = this.playerDrawTile();
                        if (newTile) {
                            this.setPlayerHandSlot(i, newTile);
                        }
                    }
                }
            } else {
                // Fill empty slots in opponent's hand
                for (let i = 0; i < opponentHandSlots.length; i++) {
                    if (opponentHandSlots[i].heldLetterTile === null) {
                        const newTile = this.opponentDrawTile();
                        if (newTile) {
                            this.setOpponentHandSlot(i, newTile);
                        }
                    }
                }
            }
        },

        // Check if game is over (board full + no valid words)
        checkGameOver() {
            // Check if board is full
            const isBoardFull = boardSlots.every(slot => slot.heldLetterTile !== null);

            if (isBoardFull) {
                // Check if there are any claimable words
                const hasClaimableWords = wordValidator.words.length > 0;

                if (hasClaimableWords) {
                    // Auto-claim all words for their owners
                    this.autoClaimAllWords();
                } else {
                    // No claimable words - destroy all tiles and continue
                    this.clearBoard();
                }
                return; // Don't check end condition yet, let game continue
            }

            // Check if game should end: bag empty AND both hands empty
            const isBagEmpty = sharedBag.length === 0;
            const isPlayerHandEmpty = playerHandSlots.every(slot => slot.heldLetterTile === null);
            const isOpponentHandEmpty = opponentHandSlots.every(slot => slot.heldLetterTile === null);

            if (isBagEmpty && isPlayerHandEmpty && isOpponentHandEmpty) {
                // Game over - no more tiles available
                isGameOver.value = true;
                if (playerScore.value > opponentScore.value) {
                    gameOverReason.value = `You win! ${playerScore.value} - ${opponentScore.value}`;
                } else if (opponentScore.value > playerScore.value) {
                    gameOverReason.value = `AI wins! ${opponentScore.value} - ${playerScore.value}`;
                } else {
                    gameOverReason.value = `Tie game! ${playerScore.value} - ${opponentScore.value}`;
                }
                this.stopGravity();
            }
        },

        // Auto-claim all words on the board for their respective owners
        autoClaimAllWords() {
            // Find all player-owned words
            const playerWords = wordValidator.words.filter(w => w.owner === "player");
            const opponentWords = wordValidator.words.filter(w => w.owner === "opponent");

            // Claim player words
            if (playerWords.length > 0) {
                const firstPlayerWord = playerWords[0];
                const firstTileIndex = firstPlayerWord.tileIndices[0];
                this.claimTilesFrom(firstTileIndex);
            }

            // Claim opponent words
            if (opponentWords.length > 0) {
                const firstOpponentWord = opponentWords[0];
                const firstTileIndex = firstOpponentWord.tileIndices[0];
                this.claimTilesFromOpponent(firstTileIndex);
            }
        },

        // Clear all tiles from the board (destroy them)
        clearBoard() {
            for (let i = 0; i < boardSlots.length; i++) {
                boardSlots[i].heldLetterTile = null;
            }
            // Mark board as unsettled to trigger re-validation
            isBoardSettled.value = false;
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