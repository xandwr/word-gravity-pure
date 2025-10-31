// components/LetterTile.tsx

import type { Tile } from "../utils/letterBag";

interface LetterTileProps {
  tile: Tile;
  onDragStart?: (tile: Tile) => void;
  draggable?: boolean;
}

export default function LetterTile({ tile, onDragStart, draggable = false }: LetterTileProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(tile);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', tile.id);
    }
  };

  return (
    <div
      className="border-2 border-white bg-amber-100 text-neutral-900 w-full h-full flex flex-col items-center justify-center relative cursor-grab active:cursor-grabbing"
      draggable={draggable}
      onDragStart={handleDragStart}
    >
      <div className="absolute top-1 lg:top-0.5 text-lg lg:text-3xl font-bold leading-none">{tile.letter === '_' ? '' : tile.letter}</div>
      <div className="absolute bottom-0 right-0 text-xs lg:text-lg font-semibold pr-0 pb-0">
        {tile.score}
      </div>
      {tile.multiplier > 1 && (
        <div className="absolute bottom-0 right-0 text-xs lg:text-lg font-semibold pr-0 pb-0 text-red-500">
          x{tile.multiplier}
        </div>
      )}
    </div>
  );
}