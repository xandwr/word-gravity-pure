/*
    $lib/game/types.ts
*/

// Represents a letter tile instance
export type TileData = Readonly<{
    id: string;
    letter: string;
    baseScore: number;
    multiplier: number;
}>;

// This is a container that can either hold nothing or a TileData object
export type TileContainer = {
    heldLetterTile: TileData | null;
}