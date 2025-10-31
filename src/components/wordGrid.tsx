// components/WordGrid.tsx

import type { Tile } from "../utils/letterBag";
import type { WordMatch } from "../utils/wordDetection";
import { getTileHighlight } from "../utils/wordDetection";
import LetterSlot from "./letterSlot";

const GRID_COLS = 7;
const GRID_ROWS = 6;

interface WordGridProps {
  tiles: (Tile | null)[];
  onDrop: (index: number) => void;
  onTileClick: (index: number) => void;
  detectedWords: WordMatch[];
  animatingTiles?: Set<number>;
  fadingTiles?: Set<number>;
}

export default function WordGrid({ tiles, onDrop, onTileClick, detectedWords, animatingTiles = new Set(), fadingTiles = new Set() }: WordGridProps) {
  return (
    <div className={`grid gap-0.5 grid-cols-${GRID_COLS} grid-rows-${GRID_ROWS}`}>
      {tiles.map((tile, i) => {
        const highlight = getTileHighlight(i, detectedWords);
        const isAnimating = animatingTiles.has(i);
        const isFading = fadingTiles.has(i);
        return (
          <LetterSlot
            key={`slot-${i}`}
            index={i}
            tile={tile}
            onDrop={onDrop}
            onClick={onTileClick}
            allowDrop={true}
            highlight={highlight}
            isAnimating={isAnimating}
            isFading={isFading}
          />
        );
      })}
    </div>
  );
}