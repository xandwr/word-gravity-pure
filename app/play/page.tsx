"use client";

/**
 * Play Page - Main game interface
 * Handles tile placement and game interaction
 */

import { useState } from "react";
import { useGameState, useGameActions } from "../context/GameContext";
import WordGrid from "../components/GameBoard/WordGrid";
import PlayerHand from "../components/PlayerHand";
import HUD from "../components/HUD";
import { Tile } from "../types";
import Link from "next/link";

export default function PlayPage() {
  const state = useGameState();
  const actions = useGameActions();
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);

  // Handle tile selection from hand
  const handleTileSelect = (tile: Tile) => {
    setSelectedTile(tile);
    setSelectedCell(null); // Clear any cell selection
  };

  // Handle cell click on board
  const handleCellClick = (row: number, col: number) => {
    // If a tile is selected and cell is empty, place the tile
    if (selectedTile && state.board[row][col] === null) {
      actions.placeTile(selectedTile, row, col);
      actions.dropGravity(); // Apply gravity after placement
      setSelectedTile(null); // Deselect tile

      // Optionally draw a new tile
      if (state.bag.length > 0 && state.player.hand.length < 7) {
        actions.drawTile();
      }
    } else {
      // Just select the cell
      setSelectedCell([row, col]);
    }
  };

  // Handle game reset
  const handleReset = () => {
    if (confirm("Are you sure you want to reset the game?")) {
      actions.resetDaily();
      setSelectedTile(null);
      setSelectedCell(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back to Home */}
        <div className="mb-4">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2"
          >
            <span>&larr;</span> Back to Home
          </Link>
        </div>

        {/* HUD */}
        <div className="mb-6">
          <HUD
            score={state.player.score}
            tilesInBag={state.bag.length}
            turn={state.turn}
            daySeed={state.daySeed}
            onReset={handleReset}
          />
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Board - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 flex justify-center">
            <WordGrid
              board={state.board}
              onCellClick={handleCellClick}
              selectedCell={selectedCell}
            />
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Player Hand */}
            <PlayerHand
              hand={state.player.hand}
              onTileSelect={handleTileSelect}
              selectedTile={selectedTile}
            />

            {/* Instructions */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <h3 className="text-white font-bold mb-2">Instructions</h3>
              <ol className="text-slate-300 text-sm space-y-1">
                <li>1. Click a tile from your hand</li>
                <li>2. Click an empty cell to place it</li>
                <li>3. Gravity will pull tiles down</li>
                <li>4. Form words to score!</li>
              </ol>
            </div>

            {/* Game Status */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <h3 className="text-white font-bold mb-2">Status</h3>
              <div className="text-slate-300 text-sm space-y-1">
                <div>Phase: <span className="text-white font-semibold capitalize">{state.phase}</span></div>
                <div>Turn: <span className="text-white font-semibold capitalize">{state.turn}</span></div>
                {selectedTile && (
                  <div className="mt-2 text-blue-400">
                    Selected: <span className="font-bold">{selectedTile.letter}</span> ({selectedTile.base} pts)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
