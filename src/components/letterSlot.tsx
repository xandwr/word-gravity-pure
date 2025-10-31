// components/LetterSlot.tsx

import type { Tile } from "../utils/letterBag";
import LetterTile from "./LetterTile";
import { useState } from "react";

interface LetterSlotProps {
  index: number;
  tile?: Tile | null;
  onDrop?: (index: number) => void;
  onDragStart?: (tile: Tile) => void;
  onClick?: (index: number) => void;
  allowDrop?: boolean;
  highlight?: 'horizontal' | 'vertical' | 'both' | null;
}

export default function LetterSlot({ index = 0, tile, onDrop, onDragStart, onClick, allowDrop = false, highlight = null }: LetterSlotProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (allowDrop && !tile) {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (allowDrop && !tile && onDrop) {
      onDrop(index);
    }
  };

  const handleClick = () => {
    if (tile && onClick && highlight) {
      onClick(index);
    }
  };

  return (
    <div
      className={`rounded-2xl border-2 shadow-lg border-black/25 aspect-square transition-colors w-11 lg:w-16 h-11 lg:h-16 ${
        isDragOver ? 'bg-blue-500/30' : ''
      } ${tile && highlight ? 'cursor-pointer hover:scale-105' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {tile && <LetterTile tile={tile} onDragStart={onDragStart} draggable={!!onDragStart} highlight={highlight} />}
    </div>
  );
}