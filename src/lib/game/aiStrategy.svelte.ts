/*
    $lib/game/aiStrategy.svelte.ts
    Intelligent AI strategy for Word Gravity
*/

import type { TileData, TileContainer } from "./types";
import { wordValidator } from "./wordValidator.svelte";
import { LETTER_SCORES } from "./letterBag.svelte";

const GRID_COLS = 7;
const GRID_ROWS = 6;

export interface PlacementOption {
    handIndex: number;
    column: number;
    score: number;
    reasoning: string[];
}

export interface ClaimOption {
    boardIndex: number;
    tileCount: number;
    totalScore: number;
    score: number;
    reasoning: string[];
}

export interface AIAction {
    type: "place" | "claim";
    placement?: PlacementOption;
    claim?: ClaimOption;
    score: number;
}

/**
 * Clone board state for simulation
 */
export function cloneBoardState(board: TileContainer[]): TileContainer[] {
    return board.map(slot => ({
        heldLetterTile: slot.heldLetterTile ? { ...slot.heldLetterTile } : null
    }));
}

/**
 * Simulate placing a tile and applying gravity to see final board state
 */
export function simulatePlacement(
    board: TileContainer[],
    tile: TileData,
    column: number
): { board: TileContainer[]; landingRow: number; multiplier: number } {
    const simBoard = cloneBoardState(board);

    // Place tile at top of column
    const topIndex = column;
    if (simBoard[topIndex].heldLetterTile !== null) {
        // Column is full, can't place
        return { board: simBoard, landingRow: -1, multiplier: 1 };
    }

    // Create a copy of the tile for simulation
    const simTile = { ...tile };
    simBoard[topIndex].heldLetterTile = simTile;

    // Apply gravity until tile settles
    let currentRow = 0;
    while (currentRow < GRID_ROWS - 1) {
        const currentIndex = currentRow * GRID_COLS + column;
        const belowIndex = (currentRow + 1) * GRID_COLS + column;

        const currentTile = simBoard[currentIndex].heldLetterTile;
        const belowTile = simBoard[belowIndex].heldLetterTile;

        if (currentTile === simTile && belowTile === null) {
            // Move tile down
            simBoard[belowIndex].heldLetterTile = currentTile;
            simBoard[currentIndex].heldLetterTile = null;
            currentRow++;
        } else if (currentTile === simTile && belowTile !== null) {
            // Tile has landed
            break;
        } else {
            currentRow++;
        }
    }

    // Calculate landing row and multiplier
    const landingRow = currentRow;
    const tilesBelow = GRID_ROWS - 1 - landingRow;
    const multiplier = tilesBelow + 1;
    simTile.multiplier = multiplier;

    return { board: simBoard, landingRow, multiplier };
}

/**
 * Detect what words would be formed on a simulated board
 */
export function detectWordsOnBoard(board: TileContainer[]): Array<{
    word: string;
    indices: number[];
    direction: "horizontal" | "vertical";
    score: number;
}> {
    const words: Array<{
        word: string;
        indices: number[];
        direction: "horizontal" | "vertical";
        score: number;
    }> = [];

    // Check horizontal words
    for (let row = 0; row < GRID_ROWS; row++) {
        let currentWord = "";
        let currentIndices: number[] = [];

        for (let col = 0; col <= GRID_COLS; col++) {
            const index = row * GRID_COLS + col;
            const tile = col < GRID_COLS ? board[index].heldLetterTile : null;

            if (tile) {
                currentWord += tile.letter;
                currentIndices.push(index);
            } else {
                // End of word or column
                if (currentWord.length >= 3 && wordValidator.isValidWord(currentWord)) {
                    const wordScore = currentIndices.reduce((sum, idx) => {
                        const t = board[idx].heldLetterTile!;
                        return sum + (t.baseScore * t.multiplier);
                    }, 0);

                    words.push({
                        word: currentWord,
                        indices: [...currentIndices],
                        direction: "horizontal",
                        score: wordScore
                    });
                }
                currentWord = "";
                currentIndices = [];
            }
        }
    }

    // Check vertical words
    for (let col = 0; col < GRID_COLS; col++) {
        let currentWord = "";
        let currentIndices: number[] = [];

        for (let row = 0; row <= GRID_ROWS; row++) {
            const index = row * GRID_COLS + col;
            const tile = row < GRID_ROWS ? board[index].heldLetterTile : null;

            if (tile) {
                currentWord += tile.letter;
                currentIndices.push(index);
            } else {
                // End of word or row
                if (currentWord.length >= 3 && wordValidator.isValidWord(currentWord)) {
                    const wordScore = currentIndices.reduce((sum, idx) => {
                        const t = board[idx].heldLetterTile!;
                        return sum + (t.baseScore * t.multiplier);
                    }, 0);

                    words.push({
                        word: currentWord,
                        indices: [...currentIndices],
                        direction: "vertical",
                        score: wordScore
                    });
                }
                currentWord = "";
                currentIndices = [];
            }
        }
    }

    return words;
}

/**
 * Evaluate a placement option
 */
export function evaluatePlacement(
    board: TileContainer[],
    handTile: TileData,
    handIndex: number,
    column: number,
    aggressiveness: number,
    playerOwnedIndices: Set<number>
): PlacementOption {
    const reasoning: string[] = [];
    let score = 0;

    // Simulate placement
    const { board: simBoard, landingRow, multiplier } = simulatePlacement(board, handTile, column);

    if (landingRow === -1) {
        // Column is full
        return {
            handIndex,
            column,
            score: -1000,
            reasoning: ["Column is full"]
        };
    }

    const landingIndex = landingRow * GRID_COLS + column;

    // Detect words formed
    const wordsFormed = detectWordsOnBoard(simBoard);
    const newWords = wordsFormed.filter(w => w.indices.includes(landingIndex));

    // Score: Words created
    const wordsScore = newWords.reduce((sum, w) => sum + w.score, 0);
    score += wordsScore;
    if (wordsScore > 0) {
        reasoning.push(`Creates ${newWords.length} word(s) worth ${wordsScore} points`);
    }

    // Score: Multiplier bonus
    const multiplierBonus = (multiplier - 1) * handTile.baseScore * 10;
    score += multiplierBonus;
    if (multiplier > 1) {
        reasoning.push(`${multiplier}x multiplier (+${multiplierBonus})`);
    }

    // Score: High-value letter placement
    if (handTile.baseScore >= 8 && multiplier >= 2) {
        const highValueBonus = handTile.baseScore * multiplier * 5;
        score += highValueBonus;
        reasoning.push(`High-value ${handTile.letter} with multiplier (+${highValueBonus})`);
    }

    // Score: Word chain potential (tile participates in multiple words)
    if (newWords.length > 1) {
        const chainBonus = newWords.length * 50;
        score += chainBonus;
        reasoning.push(`Word chain! ${newWords.length} intersecting words (+${chainBonus})`);
    }

    // Score: Blocking player's words (weighted by aggressiveness)
    let blockingScore = 0;
    for (const idx of playerOwnedIndices) {
        const playerCol = idx % GRID_COLS;
        if (playerCol === column) {
            const playerTile = board[idx].heldLetterTile;
            if (playerTile) {
                const blockValue = playerTile.baseScore * playerTile.multiplier;
                blockingScore += blockValue;
            }
        }
    }

    if (blockingScore > 0) {
        const weightedBlockingScore = blockingScore * aggressiveness * 2;
        score += weightedBlockingScore;
        reasoning.push(`Blocks player column (${blockingScore} value × ${aggressiveness.toFixed(1)} aggro = +${weightedBlockingScore.toFixed(0)})`);
    }

    // Penalty: Filling board too much (avoid game over)
    const filledSlots = board.filter(slot => slot.heldLetterTile !== null).length;
    const fullnessPenalty = (filledSlots / (GRID_COLS * GRID_ROWS)) * -50;
    score += fullnessPenalty;

    // Small randomness to avoid predictability
    const randomBonus = Math.random() * 10;
    score += randomBonus;

    return {
        handIndex,
        column,
        score,
        reasoning
    };
}

/**
 * Evaluate claiming a word
 */
export function evaluateClaim(
    board: TileContainer[],
    startIndex: number,
    opponentOwnedIndices: Set<number>,
    aggressiveness: number
): ClaimOption | null {
    const reasoning: string[] = [];

    if (!opponentOwnedIndices.has(startIndex)) {
        return null;
    }

    const tile = board[startIndex].heldLetterTile;
    if (!tile || tile.claimedBy !== null) {
        return null;
    }

    // BFS flood fill to find all claimable tiles
    const visited = new Set<number>();
    const queue = [startIndex];
    visited.add(startIndex);
    let totalScore = 0;

    while (queue.length > 0) {
        const index = queue.shift()!;
        const t = board[index].heldLetterTile;

        if (t && t.claimedBy === null) {
            totalScore += t.baseScore * t.multiplier;

            // Check adjacent tiles
            const row = Math.floor(index / GRID_COLS);
            const col = index % GRID_COLS;

            const adjacent = [];
            if (row > 0) adjacent.push((row - 1) * GRID_COLS + col);
            if (row < GRID_ROWS - 1) adjacent.push((row + 1) * GRID_COLS + col);
            if (col > 0) adjacent.push(row * GRID_COLS + (col - 1));
            if (col < GRID_COLS - 1) adjacent.push(row * GRID_COLS + (col + 1));

            for (const adjIdx of adjacent) {
                if (!visited.has(adjIdx) && opponentOwnedIndices.has(adjIdx)) {
                    const adjTile = board[adjIdx].heldLetterTile;
                    if (adjTile && adjTile.claimedBy === null) {
                        visited.add(adjIdx);
                        queue.push(adjIdx);
                    }
                }
            }
        }
    }

    const tileCount = visited.size;

    // Base score is the total point value
    let score = totalScore;
    reasoning.push(`Claim ${tileCount} tiles for ${totalScore} points`);

    // Bonus for claiming many tiles at once
    if (tileCount >= 5) {
        const bulkBonus = tileCount * 10;
        score += bulkBonus;
        reasoning.push(`Bulk claim bonus (+${bulkBonus})`);
    }

    // Bonus: Gain a swap
    const swapBonus = 20;
    score += swapBonus;
    reasoning.push(`Gain 1 swap (+${swapBonus})`);

    // Consider opportunity cost (could multipliers grow more?)
    const avgMultiplier = totalScore / tileCount / (totalScore / tileCount / 1.5); // Rough estimate
    if (avgMultiplier < 2 && aggressiveness < 0.5) {
        // Low multipliers + low aggro = wait for them to grow
        const opportunityCost = -totalScore * 0.3;
        score += opportunityCost;
        reasoning.push(`Low multipliers, wait for growth (${opportunityCost.toFixed(0)})`);
    }

    // Aggressiveness factor: claim more readily when aggressive
    const aggroBonus = aggressiveness * 30;
    score += aggroBonus;

    return {
        boardIndex: startIndex,
        tileCount,
        totalScore,
        score,
        reasoning
    };
}

/**
 * Find best AI action (place or claim)
 */
export function findBestAction(
    board: TileContainer[],
    handSlots: TileContainer[],
    playerOwnedIndices: Set<number>,
    opponentOwnedIndices: Set<number>,
    aggressiveness: number
): AIAction | null {
    const placements: PlacementOption[] = [];
    const claims: ClaimOption[] = [];

    // Evaluate all placement options
    for (let handIndex = 0; handIndex < handSlots.length; handIndex++) {
        const handTile = handSlots[handIndex].heldLetterTile;
        if (!handTile) continue;

        for (let column = 0; column < GRID_COLS; column++) {
            const placement = evaluatePlacement(
                board,
                handTile,
                handIndex,
                column,
                aggressiveness,
                playerOwnedIndices
            );
            placements.push(placement);
        }
    }

    // Evaluate all claim options
    for (const index of opponentOwnedIndices) {
        const claim = evaluateClaim(board, index, opponentOwnedIndices, aggressiveness);
        if (claim) {
            claims.push(claim);
        }
    }

    // Find best placement
    const bestPlacement = placements.reduce((best, p) =>
        p.score > best.score ? p : best
    , { score: -Infinity } as PlacementOption);

    // Find best claim
    const bestClaim = claims.reduce((best, c) =>
        c.score > best.score ? c : best
    , { score: -Infinity } as ClaimOption);

    // Choose between placing and claiming
    if (bestPlacement.score > bestClaim.score && bestPlacement.score > -Infinity) {
        return {
            type: "place",
            placement: bestPlacement,
            score: bestPlacement.score
        };
    } else if (bestClaim.score > -Infinity) {
        return {
            type: "claim",
            claim: bestClaim,
            score: bestClaim.score
        };
    }

    return null;
}
