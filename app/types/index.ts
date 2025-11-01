export type Tile = {
    id: string;
    letter: string;
    base: number;
    mult: number;
    placedBy?: "player" | "world";
};

export type Cell = Tile | null;

export type Board = Cell[][]; // rows * cols

export type PlayerState = {
    score: number;
    hand: Tile[];
    swaps: number;
    claimed: Tile[];
};

export type GameState = {
    daySeed: string;
    board: Board;
    bag: Tile[];
    player: PlayerState;
    worldIndex: number; // which turn world is on
    turn: "player" | "world";
    phase: "playing" | "ended";
};
