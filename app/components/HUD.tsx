"use client";

/**
 * HUD - Heads-Up Display showing game stats and controls
 */

interface HUDProps {
  score: number;
  tilesInBag: number;
  turn: "player" | "world";
  daySeed: string;
  onReset?: () => void;
}

export default function HUD({
  score,
  tilesInBag,
  turn,
  daySeed,
  onReset,
}: HUDProps) {
  return (
    <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center gap-8">
        {/* Game Info */}
        <div className="flex gap-6">
          <div>
            <div className="text-xs text-slate-400 uppercase">Score</div>
            <div className="text-2xl font-bold">{score}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Tiles Left</div>
            <div className="text-2xl font-bold">{tilesInBag}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Turn</div>
            <div className="text-lg font-semibold capitalize">{turn}</div>
          </div>
        </div>

        {/* Daily Seed */}
        <div className="text-right">
          <div className="text-xs text-slate-400 uppercase">Daily Puzzle</div>
          <div className="text-sm font-mono">{daySeed}</div>
        </div>

        {/* Controls */}
        {onReset && (
          <button
            onClick={onReset}
            className="
              px-4 py-2
              bg-blue-500 hover:bg-blue-600
              text-white font-semibold
              rounded-lg
              transition-colors
              text-sm
            "
          >
            Reset Game
          </button>
        )}
      </div>
    </div>
  );
}
