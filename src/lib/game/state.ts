/*
    $lib/game/state.ts
*/

import { nanoid } from "nanoid";
import type { TileData } from "./types";

export function createTile(letter: string, baseScore: number): TileData {
    return {
        id: nanoid(),
        letter,
        baseScore,
        multiplier: 1
    };
}