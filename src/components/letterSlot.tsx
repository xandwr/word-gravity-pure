// components/LetterSlot.tsx

import type { Tile } from "../utils/letterBag";
import LetterTile from "./LetterTile";
import { useState } from "react";

interface LetterSlotProps {
  index: number;
  tile?: Tile | null;
  onDrop?: (index: number) => void;
  onDragStart?: (tile: Tile) => void;
  allowDrop?: boolean;
}

export default function LetterSlot({ index = 0, tile, onDrop, onDragStart, allowDrop = false }: LetterSlotProps) {
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

  return (
    <div
      className={`border-2 border-white aspect-square transition-colors w-10 lg:w-18 h-10 lg:h-18 ${
        isDragOver ? 'bg-blue-500/30' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {tile && <LetterTile tile={tile} onDragStart={onDragStart} draggable={!!onDragStart} />}
    </div>
  );
}