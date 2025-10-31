// context/GameContext.tsx
"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type TileData = {
    id: string;
    letter: string;
    base: number;
    mult: number;
    placedBy?: "player" | "world";
};

type GameState = {
    score: number; // the player's current score total
    setScore: (n: number) => void;

    claimedTiles: TileData[]; // an array of the player's claimed letters throughout gameplay
    setClaimedTiles: React.Dispatch<React.SetStateAction<TileData[]>>;

    hand: TileData[]; // the player's current draw of letter tiles
    setHand: React.Dispatch<React.SetStateAction<TileData[]>>;

    board: (TileData | null)[]; // an array representing each cell on the board
    setBoard: React.Dispatch<React.SetStateAction<(TileData | null)[]>>;

    bag: TileData[]; // the remaining global pool for the session
    setBag: React.Dispatch<React.SetStateAction<TileData[]>>;

    currentPlayer: "player" | "world"; // the current player (player, world)
    setCurrentPlayer: (p: "player" | "world") => void;

    boardCols: number; // the number of cols to render the word grid with
    setBoardCols: (cols: number) => void;

    boardRows: number; // rows for word grid
    setBoardRows: (rows: number) => void;

    globalSeed: string; // the shared global seed used for deterministic logic
    setGlobalSeed: (s: string) => void;

    isSettling: boolean; // a flag to determine if the board is currently active (tiles are updating/moving/evaluating) or not
    setIsSettling: (b: boolean) => void;

    gameOver: boolean; // a game over flag to control eval flow
    setGameOver: (b: boolean) => void;
};

const GameContext = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
    const [score, setScore] = useState(0);

    const [claimedTiles, setClaimedTiles] = useState<TileData[]>([]);
    const [hand, setHand] = useState<TileData[]>([]);
    const [board, setBoard] = useState<(TileData | null)[]>([]);
    const [bag, setBag] = useState<TileData[]>([]);
    const [currentPlayer, setCurrentPlayer] = useState<"player" | "world">("player");
    const [boardCols, setBoardCols] = useState<number>(7);
    const [boardRows, setBoardRows] = useState<number>(6);
    const [globalSeed, setGlobalSeed] = useState<string>("");
    const [isSettling, setIsSettling] = useState<boolean>(false);
    const [gameOver, setGameOver] = useState<boolean>(false);

    return (
        <GameContext.Provider
            value={{
                score,
                setScore,
                claimedTiles,
                setClaimedTiles,
                hand,
                setHand,
                board,
                setBoard,
                bag,
                setBag,
                currentPlayer,
                setCurrentPlayer,
                boardCols,
                setBoardCols,
                boardRows,
                setBoardRows,
                globalSeed,
                setGlobalSeed,
                isSettling,
                setIsSettling,
                gameOver,
                setGameOver,
            }}
        >
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error("useGame must be inside GameProvider");
    return ctx;
}
