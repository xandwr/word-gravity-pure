// types.tsx

export type TileData = {
    id: string;
    letter: string;
    base: number;
    mult: number;
    placedBy?: "player" | "world";
};