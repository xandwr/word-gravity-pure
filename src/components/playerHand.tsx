// components/PlayerHand.tsx

import type { Tile } from "../utils/letterBag";
import LetterSlot from "./LetterSlot";

interface PlayerHandProps {
  tiles: (Tile | null)[];
  onDragStart: (tile: Tile, index: number) => void;
}

export default function PlayerHand({ tiles, onDragStart }: PlayerHandProps) {
  const handleDragStart = (tile: Tile, slotIndex: number) => {
    onDragStart(tile, slotIndex);
  };

  return (
    <div className={`grid grid-cols-8 grid-rows-1 gap-0.5`}>
      {tiles.map((tile, i) => (
        <LetterSlot
          key={i}
          index={i}
          tile={tile}
          onDragStart={(t) => handleDragStart(t, i)}
          allowDrop={false}
        />
      ))}
    </div>
  );
}