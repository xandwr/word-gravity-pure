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

  // Initialize the game on launch
  useEffect(() => {
    const bag = createLetterBag();
    const { drawn } = drawTiles(bag, 8);
    setPlayerHand(drawn);
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

  return (
    <main className="bg-neutral-800/50 h-screen max-w-2xl m-auto flex flex-col items-center justify-center-safe">
      <header className="text-4xl font-semibold">Word Gravity</header>

      <div className="my-10">
        <WordGrid tiles={gridTiles} onDrop={handleDropOnGrid} />
      </div>

      <div className="my-10">
        <PlayerHand tiles={playerHand} onDragStart={handleDragStartFromHand} />
      </div>
    </main>
  );
}

export default App;
