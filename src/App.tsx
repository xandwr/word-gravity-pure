// App.tsx

import { useState, useEffect } from "react";
import WordGrid from "./components/WordGrid";
import PlayerHand from "./components/PlayerHand";
import type { Tile } from "./utils/letterBag";
import { createLetterBag, drawTiles } from "./utils/letterBag";

function App() {
  const [playerHand, setPlayerHand] = useState<(Tile | null)[]>(Array(8).fill(null));
  const [gridTiles, setGridTiles] = useState<(Tile | null)[]>(Array(42).fill(null));
  const [draggedTile, setDraggedTile] = useState<Tile | null>(null);
  const [dragSource, setDragSource] = useState<{ type: 'hand' | 'grid'; index: number } | null>(null);
  const [swapsRemaining, setSwapsRemaining] = useState(5);
  const [letterBag, setLetterBag] = useState<Tile[]>([]);
  const [isSwapZoneHovered, setIsSwapZoneHovered] = useState(false);

  // Initialize the game on launch
  useEffect(() => {
    const bag = createLetterBag();
    const { drawn, remaining } = drawTiles(bag, 8);
    setPlayerHand(drawn);
    setLetterBag(remaining);
  }, []);

  const handleDragStartFromHand = (tile: Tile, index: number) => {
    setDraggedTile(tile);
    setDragSource({ type: 'hand', index });
  };

  const handleDropOnGrid = (gridIndex: number) => {
    if (draggedTile && dragSource && dragSource.type === 'hand') {
      // Remove tile from hand
      const newHand = [...playerHand];
      newHand[dragSource.index] = null;
      setPlayerHand(newHand);

      // Add tile to grid
      const newGrid = [...gridTiles];
      newGrid[gridIndex] = draggedTile;
      setGridTiles(newGrid);

      setDraggedTile(null);
      setDragSource(null);
    }
  };

  const handleSwap = () => {
    if (draggedTile && dragSource && dragSource.type === 'hand' && swapsRemaining > 0 && letterBag.length > 0) {
      // Get a random tile from the bag
      const randomIndex = Math.floor(Math.random() * letterBag.length);
      const newTile = letterBag[randomIndex];

      // Update the letter bag (remove the drawn tile and add the swapped tile)
      const newBag = [...letterBag];
      newBag.splice(randomIndex, 1);
      newBag.push(draggedTile);
      setLetterBag(newBag);

      // Update player hand with the new tile
      const newHand = [...playerHand];
      newHand[dragSource.index] = newTile;
      setPlayerHand(newHand);

      // Decrement swaps
      setSwapsRemaining(swapsRemaining - 1);

      setDraggedTile(null);
      setDragSource(null);
    }
  };

  const handleSwapZoneDragOver = (e: React.DragEvent) => {
    if (draggedTile && dragSource?.type === 'hand' && swapsRemaining > 0) {
      e.preventDefault();
      setIsSwapZoneHovered(true);
    }
  };

  const handleSwapZoneDragLeave = () => {
    setIsSwapZoneHovered(false);
  };

  const handleSwapZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsSwapZoneHovered(false);
    handleSwap();
  };

  return (
    <main className="bg-neutral-800/50 border-neutral-900/30 border-8 border-y-0 h-screen max-w-2xl m-auto flex flex-col items-center">
      <header className="text-2xl lg:text-5xl font-bold my-4">Word Gravity</header>

      <div className="flex gap-1">
        <h2>Players Today:</h2>
        <h2 className="font-bold">0</h2> {/* this needs to be replaced with global player count later */}
      </div>

      <div className="mt-4">
        <WordGrid tiles={gridTiles} onDrop={handleDropOnGrid} />
      </div>

      <div className="mt-12">
        <PlayerHand tiles={playerHand} onDragStart={handleDragStartFromHand} />
      </div>

      <div
        className={`flex flex-col items-center my-4 px-16 py-4 rounded-2xl border-4 transition-all ${isSwapZoneHovered && swapsRemaining > 0
            ? 'bg-blue-500/30 border-blue-400/80 shadow-lg shadow-blue-500/50'
            : 'bg-gray-400/10 border-neutral-900/60'
          }`}
        onDragOver={handleSwapZoneDragOver}
        onDragLeave={handleSwapZoneDragLeave}
        onDrop={handleSwapZoneDrop}
      >
        <h1 className="flex gap-1 text-xl font-bold text-blue-200">
          Swaps Remaining:
          <p>
            {swapsRemaining}
          </p>
        </h1>
        <div className="mt-2 flex gap-1 text-xl">
          <h2>Letters Remaining:</h2>
          <h2 className="font-semibold">{letterBag.length}</h2>
        </div>
      </div>
    </main>
  );
}

export default App;
