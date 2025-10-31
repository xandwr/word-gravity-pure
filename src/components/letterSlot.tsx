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
  isAnimating?: boolean;
  isFading?: boolean;
}

export default function LetterSlot({ index = 0, tile, onDrop, onDragStart, onClick, allowDrop = false, highlight = null, isAnimating = false, isFading = false }: LetterSlotProps) {
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
      className={`rounded-2xl border-2 shadow-lg border-black/25 aspect-square w-11 lg:w-16 h-11 lg:h-16 ${
        isDragOver ? 'bg-blue-500/30' : ''
      } ${tile && highlight ? 'cursor-pointer hover:scale-105' : ''} ${
        isAnimating ? 'animate-pulse bg-blue-500/40 scale-110 border-blue-400 transition-all duration-150' : ''
      } ${
        isFading ? 'opacity-0 scale-75 transition-all duration-300' : 'transition-all duration-150'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {tile && <LetterTile tile={tile} onDragStart={onDragStart} draggable={!!onDragStart} highlight={highlight} />}
    </div>
  );
}