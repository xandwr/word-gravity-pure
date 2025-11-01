"use client";

/**
 * WordGrid - Main game board displaying all tiles
 * Handles tile placement and board state visualization
 */

import { Board } from "../../types";
import LetterSlot from "./LetterSlot";

interface WordGridProps {
  board: Board;
  onCellClick?: (row: number, col: number) => void;
  selectedCell?: [number, number] | null;
}

export default function WordGrid({
  board,
  onCellClick,
  selectedCell = null,
}: WordGridProps) {
  const rows = board.length;
  const cols = board[0]?.length || 0;

  return (
    <div className="bg-slate-100 p-4 rounded-lg shadow-lg inline-block">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isSelected =
              selectedCell !== null &&
              selectedCell[0] === rowIndex &&
              selectedCell[1] === colIndex;

            return (
              <LetterSlot
                key={`${rowIndex}-${colIndex}`}
                cell={cell}
                row={rowIndex}
                col={colIndex}
                onClick={
                  onCellClick ? () => onCellClick(rowIndex, colIndex) : undefined
                }
                isSelected={isSelected}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
