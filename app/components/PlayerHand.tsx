"use client";

/**
 * PlayerHand - Displays the player's available tiles
 * Allows selecting tiles to place on the board
 */

import { Tile } from "../types";
import LetterTile from "./GameBoard/LetterTile";

interface PlayerHandProps {
  hand: Tile[];
  onTileSelect?: (tile: Tile) => void;
  selectedTile?: Tile | null;
}

export default function PlayerHand({
  hand,
  onTileSelect,
  selectedTile = null,
}: PlayerHandProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold text-slate-700 mb-3">Your Hand</h3>
      <div className="flex gap-2 flex-wrap">
        {hand.length === 0 ? (
          <p className="text-slate-400 italic">No tiles in hand</p>
        ) : (
          hand.map((tile) => (
            <div
              key={tile.id}
              className={`
                transition-all
                ${selectedTile?.id === tile.id ? "ring-2 ring-blue-500 rounded-lg scale-105" : ""}
              `}
            >
              <LetterTile
                tile={tile}
                onClick={onTileSelect ? () => onTileSelect(tile) : undefined}
                draggable={false}
                size="medium"
              />
            </div>
          ))
        )}
      </div>
      <div className="mt-2 text-sm text-slate-500">
        {hand.length} tile{hand.length !== 1 ? "s" : ""} remaining
      </div>
    </div>
  );
}
