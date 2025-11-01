"use client";

/**
 * LetterTile - Individual tile component displaying a letter and score
 */

import { Tile } from "../../types";

interface LetterTileProps {
  tile: Tile;
  onClick?: () => void;
  draggable?: boolean;
  size?: "small" | "medium" | "large";
}

export default function LetterTile({
  tile,
  onClick,
  draggable = false,
  size = "medium",
}: LetterTileProps) {
  const sizeClasses = {
    small: "w-10 h-10 text-lg",
    medium: "w-14 h-14 text-2xl",
    large: "w-20 h-20 text-4xl",
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        bg-gradient-to-br from-amber-100 to-amber-200
        border-2 border-amber-400
        rounded-lg
        shadow-md
        flex flex-col items-center justify-center
        font-bold
        text-amber-900
        transition-all
        hover:scale-105 hover:shadow-lg
        ${onClick ? "cursor-pointer" : ""}
        ${draggable ? "cursor-grab active:cursor-grabbing" : ""}
        relative
      `}
      onClick={onClick}
      draggable={draggable}
    >
      {/* Letter */}
      <div className="font-bold leading-none">{tile.letter}</div>

      {/* Score (base × multiplier) */}
      <div className="absolute bottom-0.5 right-1 text-xs text-amber-700">
        {tile.mult > 1 ? `${tile.base}×${tile.mult}` : tile.base}
      </div>
    </div>
  );
}
