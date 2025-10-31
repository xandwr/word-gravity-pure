// components/WordGrid.tsx

import type { Tile } from "../utils/letterBag";
import LetterSlot from "./LetterSlot";

const GRID_COLS = 7;
const GRID_ROWS = 6;

interface WordGridProps {
  tiles: (Tile | null)[];
  onDrop: (index: number) => void;
}

export default function WordGrid({ tiles, onDrop }: WordGridProps) {
  return (
    <div className={`grid grid-cols-${GRID_COLS} grid-rows-${GRID_ROWS} gap-0.5`}>
      {tiles.map((tile, i) => (
        <LetterSlot
          key={i}
          index={i}
          tile={tile}
          onDrop={onDrop}
          allowDrop={true}
        />
      ))}
    </div>
  );
}