/*
    $lib/game/types.ts
*/

// Represents a letter tile instance
export type TileData = {
    id: string;
    letter: string;
    baseScore: number;
    multiplier: number;
    claimedBy: Player | null; // Which player has claimed this tile (null if unclaimed)
    fadingOut: boolean; // Whether this tile is in the process of fading out
    fadeStartTime?: number; // Timestamp when fade started
};

// This is a container that can either hold nothing or a TileData object
export type TileContainer = {
    heldLetterTile: TileData | null;
};

// Highlight types for validated tiles
export type TileHighlight = "none" | "horizontal" | "vertical" | "intersection" | "opponent-owned" | "both-players";

// Player type
export type Player = "player" | "opponent";