"use client";

/**
 * LetterSlot - A single cell on the game board
 * Can be empty or contain a tile
 */

import { Cell } from "../../types";
import LetterTile from "./LetterTile";

interface LetterSlotProps {
  cell: Cell;
  row: number;
  col: number;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function LetterSlot({
  cell,
  row,
  col,
  onClick,
  isSelected = false,
}: LetterSlotProps) {
  return (
    <div
      className={`
        w-14 h-14
        border border-slate-300
        rounded
        flex items-center justify-center
        transition-all
        ${onClick ? "cursor-pointer hover:bg-slate-100" : ""}
        ${isSelected ? "ring-2 ring-blue-400 bg-blue-50" : "bg-white"}
        ${cell === null ? "" : "bg-slate-50"}
      `}
      onClick={onClick}
      data-row={row}
      data-col={col}
    >
      {cell && <LetterTile tile={cell} size="medium" />}
    </div>
  );
}
