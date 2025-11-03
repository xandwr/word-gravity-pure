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
 * Calculate letter synergy - how well this letter could combine with adjacent letters
 */
function calculateLetterSynergy(
    board: TileContainer[],
    landingIndex: number,
    letter: string
): { score: number; potential: string[] } {
    const row = Math.floor(landingIndex / GRID_COLS);
    const col = landingIndex % GRID_COLS;
    const potential: string[] = [];
    let synergyScore = 0;

    // Check horizontal neighbors
    const leftIndex = row * GRID_COLS + (col - 1);
    const rightIndex = row * GRID_COLS + (col + 1);
    const leftTile = col > 0 ? board[leftIndex].heldLetterTile : null;
    const rightTile = col < GRID_COLS - 1 ? board[rightIndex].heldLetterTile : null;

    if (leftTile || rightTile) {
        // Common prefixes/suffixes
        const commonStarts = ['TH', 'CH', 'SH', 'WH', 'ST', 'TR', 'PR', 'BR', 'CR', 'DR', 'GR', 'FR'];
        const commonEnds = ['ED', 'ER', 'LY', 'NG', 'TH', 'ST', 'ND'];

        const leftStr = leftTile ? leftTile.letter + letter : '';
        const rightStr = rightTile ? letter + rightTile.letter : '';

        for (const combo of commonStarts) {
            if (leftStr === combo || rightStr === combo) {
                synergyScore += 15;
                potential.push(combo);
            }
        }
        for (const combo of commonEnds) {
            if (leftStr === combo || rightStr === combo) {
                synergyScore += 15;
                potential.push(combo);
            }
        }
    }

    // Check vertical neighbors
    const aboveIndex = (row - 1) * GRID_COLS + col;
    const belowIndex = (row + 1) * GRID_COLS + col;
    const aboveTile = row > 0 ? board[aboveIndex].heldLetterTile : null;
    const belowTile = row < GRID_ROWS - 1 ? board[belowIndex].heldLetterTile : null;

    // Vowel-consonant balance
    const vowels = 'AEIOU';
    const isVowel = vowels.includes(letter);

    let adjacentVowels = 0;
    let adjacentConsonants = 0;
    for (const tile of [leftTile, rightTile, aboveTile, belowTile]) {
        if (tile) {
            if (vowels.includes(tile.letter)) adjacentVowels++;
            else adjacentConsonants++;
        }
    }

    // Good balance: vowels next to consonants
    if (isVowel && adjacentConsonants > 0) {
        synergyScore += adjacentConsonants * 8;
    } else if (!isVowel && adjacentVowels > 0) {
        synergyScore += adjacentVowels * 8;
    }

    return { score: synergyScore, potential };
}

/**
 * Detect potential words the player could form
 */
function detectPlayerThreats(
    board: TileContainer[],
    playerOwnedIndices: Set<number>
): Array<{ indices: number[]; pattern: string; threat: number }> {
    const threats: Array<{ indices: number[]; pattern: string; threat: number }> = [];

    // Check for partial words that could be completed
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS - 2; col++) {
            const indices = [
                row * GRID_COLS + col,
                row * GRID_COLS + col + 1,
                row * GRID_COLS + col + 2
            ];

            const tiles = indices.map(i => board[i].heldLetterTile);
            const owned = indices.filter(i => playerOwnedIndices.has(i));

            // Player has 2 out of 3 letters
            if (owned.length === 2 && tiles.filter(t => t !== null).length === 2) {
                const pattern = tiles.map(t => t ? t.letter : '_').join('');
                const totalValue = tiles.reduce((sum, t) =>
                    t ? sum + (t.baseScore * t.multiplier) : sum, 0
                );
                threats.push({ indices, pattern, threat: totalValue });
            }
        }
    }

    // Check vertical threats
    for (let col = 0; col < GRID_COLS; col++) {
        for (let row = 0; row < GRID_ROWS - 2; row++) {
            const indices = [
                row * GRID_COLS + col,
                (row + 1) * GRID_COLS + col,
                (row + 2) * GRID_COLS + col
            ];

            const tiles = indices.map(i => board[i].heldLetterTile);
            const owned = indices.filter(i => playerOwnedIndices.has(i));

            if (owned.length === 2 && tiles.filter(t => t !== null).length === 2) {
                const pattern = tiles.map(t => t ? t.letter : '_').join('');
                const totalValue = tiles.reduce((sum, t) =>
                    t ? sum + (t.baseScore * t.multiplier) : sum, 0
                );
                threats.push({ indices, pattern, threat: totalValue });
            }
        }
    }

    return threats;
}

/**
 * Calculate future word potential for this placement
 */
function calculateFutureWordPotential(
    board: TileContainer[],
    landingIndex: number,
    letter: string
): number {
    const row = Math.floor(landingIndex / GRID_COLS);
    const col = landingIndex % GRID_COLS;
    let potential = 0;

    // Horizontal potential: how many empty spaces in this row?
    let horizontalSpace = 0;
    let horizontalTiles = 0;
    for (let c = 0; c < GRID_COLS; c++) {
        const idx = row * GRID_COLS + c;
        if (board[idx].heldLetterTile === null) horizontalSpace++;
        else horizontalTiles++;
    }
    if (horizontalTiles > 0 && horizontalSpace > 0) {
        potential += horizontalSpace * 5; // Empty spaces = room to build words
    }

    // Vertical potential: how many tiles below (can stack more)?
    const tilesBelow = GRID_ROWS - 1 - row;
    potential += tilesBelow * 3;

    // Adjacent letters potential
    const adjacentIndices = [
        row * GRID_COLS + (col - 1),
        row * GRID_COLS + (col + 1),
        (row - 1) * GRID_COLS + col,
        (row + 1) * GRID_COLS + col
    ];

    let adjacentCount = 0;
    for (let i = 0; i < adjacentIndices.length; i++) {
        const idx = adjacentIndices[i];
        if (idx >= 0 && idx < GRID_COLS * GRID_ROWS) {
            // Check bounds properly
            const adjRow = Math.floor(idx / GRID_COLS);
            const adjCol = idx % GRID_COLS;
            if (Math.abs(adjRow - row) <= 1 && Math.abs(adjCol - col) <= 1) {
                if (board[idx].heldLetterTile !== null) {
                    adjacentCount++;
                }
            }
        }
    }

    // Having 1-2 adjacent letters is good (can build on them)
    // Having 3-4 might mean board is getting crowded
    if (adjacentCount >= 1 && adjacentCount <= 2) {
        potential += adjacentCount * 10;
    }

    return potential;
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

    // Score: Words created (HEAVILY WEIGHTED)
    const wordsScore = newWords.reduce((sum, w) => sum + w.score, 0);
    if (wordsScore > 0) {
        // Multiply by 3 to make actual word formation the priority
        score += wordsScore * 3;
        reasoning.push(`Creates ${newWords.length} word(s) worth ${wordsScore * 3} points`);
    } else {
        // PENALTY for not forming a word (unless it's strategic positioning)
        const noWordPenalty = -20;
        score += noWordPenalty;
    }

    // Score: Multiplier bonus (but less important than words)
    const multiplierBonus = (multiplier - 1) * handTile.baseScore * 5;
    score += multiplierBonus;
    if (multiplier > 1) {
        reasoning.push(`${multiplier}x multiplier (+${multiplierBonus})`);
    }

    // Score: High-value letter placement
    if (handTile.baseScore >= 8 && multiplier >= 2) {
        const highValueBonus = handTile.baseScore * multiplier * 8;
        score += highValueBonus;
        reasoning.push(`High-value ${handTile.letter} with multiplier (+${highValueBonus})`);
    }

    // Score: Word chain potential (tile participates in multiple words)
    if (newWords.length > 1) {
        const chainBonus = newWords.length * 100;
        score += chainBonus;
        reasoning.push(`Word chain! ${newWords.length} intersecting words (+${chainBonus})`);
    }

    // Score: Letter synergy (positions letter well for future words)
    const synergy = calculateLetterSynergy(simBoard, landingIndex, handTile.letter);
    if (synergy.score > 0) {
        score += synergy.score;
        reasoning.push(`Letter synergy: ${synergy.potential.join(', ')} (+${synergy.score})`);
    }

    // Score: Future word potential
    const futurePotential = calculateFutureWordPotential(simBoard, landingIndex, handTile.letter);
    score += futurePotential;
    if (futurePotential > 20) {
        reasoning.push(`Good positioning for future words (+${futurePotential})`);
    }

    // Score: Blocking player's threats (INTELLIGENT blocking)
    const threats = detectPlayerThreats(board, playerOwnedIndices);
    let blockingScore = 0;
    for (const threat of threats) {
        if (threat.indices.includes(landingIndex)) {
            blockingScore += threat.threat * 2; // Disrupting a near-complete word is valuable
            reasoning.push(`BLOCKS player threat "${threat.pattern}" (${threat.threat * 2})`);
        }
    }

    // Dumb column blocking (less valuable, only when aggressive)
    let columnBlockScore = 0;
    for (const idx of playerOwnedIndices) {
        const playerCol = idx % GRID_COLS;
        if (playerCol === column) {
            const playerTile = board[idx].heldLetterTile;
            if (playerTile) {
                columnBlockScore += playerTile.baseScore * playerTile.multiplier * 0.5;
            }
        }
    }

    const totalBlockingScore = blockingScore + (columnBlockScore * aggressiveness);
    score += totalBlockingScore;

    if (columnBlockScore > 0 && aggressiveness > 0.6) {
        reasoning.push(`Column pressure (+${(columnBlockScore * aggressiveness).toFixed(0)})`);
    }

    // Penalty: Filling board too much (avoid game over)
    const filledSlots = simBoard.filter(slot => slot.heldLetterTile !== null).length;
    const fullnessPenalty = (filledSlots / (GRID_COLS * GRID_ROWS)) * -100;
    score += fullnessPenalty;

    // Small randomness to avoid predictability (reduced from 10 to 5)
    const randomBonus = Math.random() * 5;
    score += randomBonus;

    return {
        handIndex,
        column,
        score,
        reasoning
    };
}

/**
 * Evaluate claiming a word - strategic timing is key
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
    let sumOfMultipliers = 0;
    let highestMultiplier = 0;

    while (queue.length > 0) {
        const index = queue.shift()!;
        const t = board[index].heldLetterTile;

        if (t && t.claimedBy === null) {
            totalScore += t.baseScore * t.multiplier;
            sumOfMultipliers += t.multiplier;
            highestMultiplier = Math.max(highestMultiplier, t.multiplier);

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
    const avgMultiplier = sumOfMultipliers / tileCount;

    // Base score is the total point value
    let score = totalScore;
    reasoning.push(`Claim ${tileCount} tiles for ${totalScore} points`);

    // Bonus for claiming many tiles at once
    if (tileCount >= 5) {
        const bulkBonus = tileCount * 15;
        score += bulkBonus;
        reasoning.push(`Bulk claim bonus (+${bulkBonus})`);
    }

    // Bonus: Gain a swap (very valuable)
    const swapBonus = 30;
    score += swapBonus;
    reasoning.push(`Gain 1 swap (+${swapBonus})`);

    // INTELLIGENT opportunity cost calculation
    // Wait if: low multipliers AND player could still add to these tiles
    const potentialGrowth = calculatePotentialGrowth(board, Array.from(visited), opponentOwnedIndices);

    if (avgMultiplier < 2.5 && potentialGrowth > totalScore * 0.3) {
        // Tiles could grow significantly - maybe wait
        const waitingBonus = -potentialGrowth * (1 - aggressiveness);
        score += waitingBonus;
        reasoning.push(`Could grow by ${potentialGrowth.toFixed(0)} - consider waiting (${waitingBonus.toFixed(0)})`);
    }

    // CLAIM URGENCY: If multipliers are good, claim NOW before they're used
    if (avgMultiplier >= 3) {
        const urgencyBonus = totalScore * 0.5;
        score += urgencyBonus;
        reasoning.push(`High multipliers - claim now! (+${urgencyBonus.toFixed(0)})`);
    }

    // DEFENSIVE CLAIMING: If player is close to completing words, claim to deny them
    const threatLevel = assessPlayerWordThreat(board, Array.from(visited), opponentOwnedIndices);
    if (threatLevel > 0) {
        const defensiveBonus = threatLevel * 1.5;
        score += defensiveBonus;
        reasoning.push(`Prevents player word completion (+${defensiveBonus.toFixed(0)})`);
    }

    // Aggressiveness factor: aggressive AI claims more readily
    if (aggressiveness > 0.6) {
        const aggroBonus = totalScore * aggressiveness * 0.4;
        score += aggroBonus;
        reasoning.push(`Aggressive claiming (+${aggroBonus.toFixed(0)})`);
    } else if (aggressiveness < 0.3) {
        // Patient AI waits for better opportunities
        const patienceBonus = -totalScore * 0.2;
        score += patienceBonus;
        reasoning.push(`Patient strategy (${patienceBonus.toFixed(0)})`);
    }

    return {
        boardIndex: startIndex,
        tileCount,
        totalScore,
        score,
        reasoning
    };
}

/**
 * Calculate how much these tiles could potentially grow
 */
function calculatePotentialGrowth(
    board: TileContainer[],
    indices: number[],
    opponentOwnedIndices: Set<number>
): number {
    let potentialGrowth = 0;

    for (const idx of indices) {
        const tile = board[idx].heldLetterTile;
        if (!tile) continue;

        const row = Math.floor(idx / GRID_COLS);
        const col = idx % GRID_COLS;

        // Check if player could add tiles above this one (increasing multiplier)
        const aboveIndex = (row - 1) * GRID_COLS + col;
        if (row > 0 && opponentOwnedIndices.has(aboveIndex)) {
            const aboveTile = board[aboveIndex].heldLetterTile;
            if (aboveTile === null) {
                // Player could add more tiles here, increasing multiplier
                const currentValue = tile.baseScore * tile.multiplier;
                const futureValue = tile.baseScore * (tile.multiplier + 1);
                potentialGrowth += (futureValue - currentValue);
            }
        }
    }

    return potentialGrowth;
}

/**
 * Assess if these tiles are part of a threatening word pattern
 */
function assessPlayerWordThreat(
    board: TileContainer[],
    indices: number[],
    opponentOwnedIndices: Set<number>
): number {
    let threatScore = 0;

    // Check if indices form partial horizontal words
    const rows = new Map<number, number[]>();
    for (const idx of indices) {
        const row = Math.floor(idx / GRID_COLS);
        if (!rows.has(row)) rows.set(row, []);
        rows.get(row)!.push(idx);
    }

    for (const [row, rowIndices] of rows) {
        rowIndices.sort((a, b) => a - b);

        // Check if consecutive (forming a word)
        for (let i = 0; i < rowIndices.length - 1; i++) {
            const idx1 = rowIndices[i];
            const idx2 = rowIndices[i + 1];

            if (idx2 - idx1 === 1) {
                // Consecutive tiles - could be part of a word
                const tile1 = board[idx1].heldLetterTile;
                const tile2 = board[idx2].heldLetterTile;
                if (tile1 && tile2) {
                    threatScore += (tile1.baseScore * tile1.multiplier + tile2.baseScore * tile2.multiplier) * 0.3;
                }
            }
        }
    }

    // Check vertical patterns
    const cols = new Map<number, number[]>();
    for (const idx of indices) {
        const col = idx % GRID_COLS;
        if (!cols.has(col)) cols.set(col, []);
        cols.get(col)!.push(idx);
    }

    for (const [col, colIndices] of cols) {
        colIndices.sort((a, b) => a - b);

        for (let i = 0; i < colIndices.length - 1; i++) {
            const idx1 = colIndices[i];
            const idx2 = colIndices[i + 1];

            if (idx2 - idx1 === GRID_COLS) {
                // Consecutive tiles vertically
                const tile1 = board[idx1].heldLetterTile;
                const tile2 = board[idx2].heldLetterTile;
                if (tile1 && tile2) {
                    threatScore += (tile1.baseScore * tile1.multiplier + tile2.baseScore * tile2.multiplier) * 0.3;
                }
            }
        }
    }

    return threatScore;
}

/**
 * Find best AI action (place or claim)
 */
export function findBestAction(
    board: TileContainer[],
    handSlots: TileContainer[],
    playerOwnedIndices: Set<number>,
    opponentOwnedIndices: Set<number>,
    aggressiveness: number,
    debugLogging = false
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

    if (debugLogging) {
        console.group('🤖 AI Decision Making');
        console.log(`Aggressiveness: ${(aggressiveness * 100).toFixed(0)}%`);

        if (bestPlacement.score > -Infinity) {
            console.log(`\n📍 Best Placement (score: ${bestPlacement.score.toFixed(1)}):`);
            console.log(`  → Column ${bestPlacement.column}`);
            console.log(`  → Reasoning:`, bestPlacement.reasoning);
        }

        if (bestClaim.score > -Infinity) {
            console.log(`\n🎯 Best Claim (score: ${bestClaim.score.toFixed(1)}):`);
            console.log(`  → ${bestClaim.tileCount} tiles for ${bestClaim.totalScore} points`);
            console.log(`  → Reasoning:`, bestClaim.reasoning);
        }

        if (bestPlacement.score > bestClaim.score && bestPlacement.score > -Infinity) {
            console.log(`\n✅ DECISION: PLACE tile in column ${bestPlacement.column}`);
        } else if (bestClaim.score > -Infinity) {
            console.log(`\n✅ DECISION: CLAIM ${bestClaim.tileCount} tiles`);
        }

        console.groupEnd();
    }

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
