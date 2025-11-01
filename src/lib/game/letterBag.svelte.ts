/*
    $lib/game/letterBag.svelte.ts
*/

import type { TileData } from "$lib/game/types";
import { createTile } from "$lib/game/state.svelte";

export const LETTER_SCORES: Record<string, number> = {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4,
    I: 1, J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3,
    Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8,
    Y: 4, Z: 10,
};

export const LETTER_COUNTS: Record<string, number> = {
    A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2,
    I: 9, J: 1, K: 1, L: 4, M: 2, N: 6, O: 8, P: 2,
    Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2, W: 2, X: 1,
    Y: 2, Z: 1,
};

// Create the full bag reactively
export function createLetterBag() {
    const bag = $state<TileData[]>([]);
    for (const letter of Object.keys(LETTER_COUNTS)) {
        const count = LETTER_COUNTS[letter];
        const score = LETTER_SCORES[letter] ?? 0;
        for (let j = 0; j < count; j++) {
            bag.push(createTile(letter, score));
        }
    }
    return bag;
}

// Generic draw from bag logic
export function drawFromBag(bag: TileData[], count = 1): TileData[] {
    const drawn: TileData[] = [];
    for (let i = 0; i < count && bag.length > 0; i++) {
        const idx = Math.floor(Math.random() * bag.length);
        const [tile] = bag.splice(idx, 1); // remove from bag
        drawn.push(tile);
    }
    return drawn;
}