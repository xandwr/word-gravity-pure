// components/LetterTile.tsx

import type { Tile } from "../utils/letterBag";

interface LetterTileProps {
  tile: Tile;
  onDragStart?: (tile: Tile) => void;
  draggable?: boolean;
  highlight?: 'horizontal' | 'vertical' | 'both' | null;
}

export default function LetterTile({ tile, onDragStart, draggable = false, highlight = null }: LetterTileProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(tile);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', tile.id);
    }
  };

  // Determine letter color based on highlight
  const getLetterColor = () => {
    if (highlight === 'horizontal') return 'text-blue-600';
    if (highlight === 'vertical') return 'text-orange-600';
    if (highlight === 'both') return 'text-purple-600';
    return 'text-neutral-900';
  };

  return (
    <div
      className="rounded-xl border lg:border-4 border-black/20 bg-amber-100 w-full h-full flex flex-col items-center justify-center relative cursor-grab active:cursor-grabbing transition-all duration-100"
      draggable={draggable}
      onDragStart={handleDragStart}
    >
      <div className={`absolute top-1 lg:top-0.5 text-lg lg:text-3xl font-semibold leading-none ${getLetterColor()}`}>{tile.letter === '_' ? '' : tile.letter}</div>
      <div className="absolute bottom-0.5 right-0.75 text-xs lg:text-sm font-bold pr-0 pb-0">
        {tile.score}
      </div>
      {tile.multiplier > 1 && (
        <div className="absolute bottom-0 right-0 text-xs lg:text-sm font-bold pr-0 pb-0 text-red-500">
          x{tile.multiplier}
        </div>
      )}
    </div>
  );
}