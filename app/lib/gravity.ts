// app/lib/gravity.ts

/**
 * Gravity physics simulation for the game board.
 * Tiles fall downward in columns until they rest on another tile or the bottom.
 */

import { Board, Cell } from "../types";

/**
 * Default board dimensions
 */
export const BOARD_ROWS = 10;
export const BOARD_COLS = 10;

/**
 * Creates an empty board with specified dimensions
 */
export function createEmptyBoard(rows: number = BOARD_ROWS, cols: number = BOARD_COLS): Board {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

/**
 * Applies gravity to a single column
 * Moves all tiles downward until they rest on something
 * Returns the new column
 */
function applyGravityToColumn(column: Cell[]): Cell[] {
  // Filter out nulls and collect tiles
  const tiles = column.filter((cell): cell is NonNullable<Cell> => cell !== null);

  // Create new column with tiles at the bottom
  const newColumn: Cell[] = Array(column.length).fill(null);

  // Place tiles from bottom up
  for (let i = 0; i < tiles.length; i++) {
    newColumn[column.length - 1 - i] = tiles[tiles.length - 1 - i];
  }

  return newColumn;
}

/**
 * Applies gravity to entire board
 * Each column independently drops tiles to the bottom
 * Returns a new board (immutable operation)
 */
export function applyGravity(board: Board): Board {
  const rows = board.length;
  const cols = board[0]?.length || 0;

  // Create new board
  const newBoard: Board = createEmptyBoard(rows, cols);

  // Process each column
  for (let col = 0; col < cols; col++) {
    // Extract column
    const column: Cell[] = [];
    for (let row = 0; row < rows; row++) {
      column.push(board[row][col]);
    }

    // Apply gravity to column
    const newColumn = applyGravityToColumn(column);

    // Place column back in board
    for (let row = 0; row < rows; row++) {
      newBoard[row][col] = newColumn[row];
    }
  }

  return newBoard;
}

/**
 * Places a tile at a specific position on the board
 * Does NOT apply gravity - call applyGravity separately
 * Returns a new board (immutable)
 */
export function placeTile(board: Board, row: number, col: number, tile: Cell): Board {
  const newBoard = board.map(r => [...r]);
  newBoard[row][col] = tile;
  return newBoard;
}

/**
 * Removes a tile from a specific position
 * Returns a new board (immutable)
 */
export function removeTile(board: Board, row: number, col: number): Board {
  const newBoard = board.map(r => [...r]);
  newBoard[row][col] = null;
  return newBoard;
}

/**
 * Checks if a board position is empty
 */
export function isEmptyCell(board: Board, row: number, col: number): boolean {
  if (row < 0 || row >= board.length || col < 0 || col >= board[0].length) {
    return false; // Out of bounds
  }
  return board[row][col] === null;
}

/**
 * Checks if the board is stable (no tiles floating)
 * Used to verify gravity has been fully applied
 */
export function isBoardStable(board: Board): boolean {
  const rows = board.length;
  const cols = board[0]?.length || 0;

  for (let col = 0; col < cols; col++) {
    let foundEmpty = false;
    for (let row = rows - 1; row >= 0; row--) {
      if (board[row][col] === null) {
        foundEmpty = true;
      } else if (foundEmpty) {
        // Found a tile above an empty space - not stable
        return false;
      }
    }
  }

  return true;
}

/**
 * Counts total number of tiles on the board
 */
export function countTilesOnBoard(board: Board): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell !== null) count++;
    }
  }
  return count;
}

/**
 * Checks if the board is full (no empty cells)
 */
export function isBoardFull(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (cell === null) return false;
    }
  }
  return true;
}

/**
 * Gets all empty positions on the board
 * Returns array of [row, col] tuples
 */
export function getEmptyPositions(board: Board): [number, number][] {
  const positions: [number, number][] = [];
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col] === null) {
        positions.push([row, col]);
      }
    }
  }
  return positions;
}
