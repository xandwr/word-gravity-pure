"use client";

/**
 * Game Context - Central state management for Word Gravity
 * Provides game state and actions to all components
 */

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from "react";
import { GameState, Tile } from "../types";
import { getDailySeed } from "../lib/seed";
import { createLetterBag, drawTiles } from "../lib/bag";
import { createEmptyBoard, applyGravity, placeTile as placeTileOnBoard } from "../lib/gravity";

// Action types
type GameAction =
  | { type: "INIT_GAME"; seed: string }
  | { type: "PLACE_TILE"; tile: Tile; row: number; col: number }
  | { type: "DROP_GRAVITY" }
  | { type: "DRAW_TILE" }
  | { type: "RESET_DAILY" };

// Context type
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Initial state factory
function createInitialState(seed: string): GameState {
  const bag = createLetterBag(seed);
  const [hand, remainingBag] = drawTiles(bag, 7); // Start with 7 tiles

  return {
    daySeed: seed,
    board: createEmptyBoard(),
    bag: remainingBag,
    player: {
      score: 0,
      hand,
      swaps: 3, // Allow 3 swaps per game
      claimed: [],
    },
    worldIndex: 0,
    turn: "player",
    phase: "playing",
  };
}

// Reducer function
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "INIT_GAME": {
      return createInitialState(action.seed);
    }

    case "PLACE_TILE": {
      const { tile, row, col } = action;

      // Remove tile from player's hand
      const newHand = state.player.hand.filter((t) => t.id !== tile.id);

      // Place tile on board (without gravity applied yet)
      const newBoard = placeTileOnBoard(state.board, row, col, {
        ...tile,
        placedBy: "player",
      });

      return {
        ...state,
        board: newBoard,
        player: {
          ...state.player,
          hand: newHand,
        },
      };
    }

    case "DROP_GRAVITY": {
      const newBoard = applyGravity(state.board);
      return {
        ...state,
        board: newBoard,
      };
    }

    case "DRAW_TILE": {
      if (state.bag.length === 0) {
        return state; // No tiles left to draw
      }

      const [drawn, remainingBag] = drawTiles(state.bag, 1);

      return {
        ...state,
        bag: remainingBag,
        player: {
          ...state.player,
          hand: [...state.player.hand, ...drawn],
        },
      };
    }

    case "RESET_DAILY": {
      const newSeed = getDailySeed();
      return createInitialState(newSeed);
    }

    default:
      return state;
  }
}

// Provider component
interface GameProviderProps {
  children: ReactNode;
  initialSeed?: string;
}

export function GameProvider({ children, initialSeed }: GameProviderProps) {
  const [isClient, setIsClient] = useState(false);
  const seed = initialSeed || getDailySeed();
  const [state, dispatch] = useReducer(gameReducer, seed, createInitialState);

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render until client-side to avoid hydration mismatch
  if (!isClient) {
    return null;
  }

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

// Hook to use game context
export function useGameContext() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
}

// Convenience hooks for specific parts of state
export function useGameState() {
  const { state } = useGameContext();
  return state;
}

export function useGameActions() {
  const { dispatch } = useGameContext();

  return {
    initGame: (seed: string) => dispatch({ type: "INIT_GAME", seed }),
    placeTile: (tile: Tile, row: number, col: number) =>
      dispatch({ type: "PLACE_TILE", tile, row, col }),
    dropGravity: () => dispatch({ type: "DROP_GRAVITY" }),
    drawTile: () => dispatch({ type: "DRAW_TILE" }),
    resetDaily: () => dispatch({ type: "RESET_DAILY" }),
  };
}
