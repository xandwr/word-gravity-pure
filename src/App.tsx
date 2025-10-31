// App.tsx

import { useState, useEffect } from "react";
import WordGrid from "./components/WordGrid";
import PlayerHand from "./components/PlayerHand";
import type { Tile } from "./utils/letterBag";
import { createLetterBag, drawTiles } from "./utils/letterBag";
import { detectWords, loadDictionary, type WordMatch, findConnectedWordChain, getUniqueIndicesFromWords, calculateWordChainScore } from "./utils/wordDetection";
import { useGameStore } from "./store/gameStore";
import { getTodaysSeed } from "./utils/seededRandom";
import { executeWorldTurn } from "./utils/worldTurn";

function App() {
  const {
    score,
    addScore,
    claimedWords,
    addClaimedWords,
    currentTurn,
    setTurn,
    worldSeed,
    setWorldSeed,
    worldTurnCount,
    incrementWorldTurnCount
  } = useGameStore();
  const [playerHand, setPlayerHand] = useState<(Tile | null)[]>(Array(8).fill(null));
  const [gridTiles, setGridTiles] = useState<(Tile | null)[]>(Array(42).fill(null));
  const [draggedTile, setDraggedTile] = useState<Tile | null>(null);
  const [dragSource, setDragSource] = useState<{ type: 'hand' | 'grid'; index: number } | null>(null);
  const [swapsRemaining, setSwapsRemaining] = useState(5);
  const [letterBag, setLetterBag] = useState<Tile[]>([]);
  const [isSwapZoneHovered, setIsSwapZoneHovered] = useState(false);
  const [detectedWords, setDetectedWords] = useState<WordMatch[]>([]);
  const [gameOver, setGameOver] = useState(false);

  // Initialize the game on launch
  useEffect(() => {
    // Load dictionary first
    loadDictionary().then(() => {
      const bag = createLetterBag();
      const { drawn, remaining } = drawTiles(bag, 8);
      setPlayerHand(drawn);
      setLetterBag(remaining);

      // Set today's seed for deterministic world turns
      const seed = getTodaysSeed();
      setWorldSeed(seed);
    });
  }, [setWorldSeed]);

  const applyMultipliers = (grid: (Tile | null)[]): (Tile | null)[] => {
    const GRID_COLS = 7;
    const GRID_ROWS = 6;
    const newGrid = [...grid];

    // Reset all multipliers to 1
    for (let i = 0; i < newGrid.length; i++) {
      if (newGrid[i]) {
        newGrid[i] = {
          ...newGrid[i]!,
          multiplier: 1
        };
      }
    }

    // For each column, each tile adds +1 multiplier to all tiles below it
    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const currentIndex = row * GRID_COLS + col;
        const currentTile = newGrid[currentIndex];

        if (currentTile) {
          // This tile adds +1 to the multiplier of all tiles below it
          for (let belowRow = row + 1; belowRow < GRID_ROWS; belowRow++) {
            const belowIndex = belowRow * GRID_COLS + col;
            const belowTile = newGrid[belowIndex];

            if (belowTile) {
              newGrid[belowIndex] = {
                ...belowTile,
                multiplier: belowTile.multiplier + 1
              };
            }
          }
        }
      }
    }

    return newGrid;
  };

  const applyGravityStep = (grid: (Tile | null)[]): { newGrid: (Tile | null)[]; moved: boolean } => {
    const GRID_COLS = 7;
    const GRID_ROWS = 6;
    const newGrid = [...grid];
    let moved = false;

    // Process each column from bottom to top
    for (let col = 0; col < GRID_COLS; col++) {
      // Start from the second-to-last row and move up
      for (let row = GRID_ROWS - 2; row >= 0; row--) {
        const currentIndex = row * GRID_COLS + col;
        const belowIndex = (row + 1) * GRID_COLS + col;

        // If current cell has a tile and the cell below is empty, move it down
        if (newGrid[currentIndex] && !newGrid[belowIndex]) {
          newGrid[belowIndex] = newGrid[currentIndex];
          newGrid[currentIndex] = null;
          moved = true;
        }
      }
    }

    return { newGrid, moved };
  };

  const animateGravity = (initialGrid: (Tile | null)[], onComplete?: (finalGrid: (Tile | null)[]) => void) => {
    let currentGrid = initialGrid;

    const step = () => {
      const { newGrid, moved } = applyGravityStep(currentGrid);
      setGridTiles(newGrid);

      if (moved) {
        currentGrid = newGrid;
        setTimeout(step, 100); // 100ms delay between each step
      } else {
        // Gravity has settled, apply multipliers and detect words
        const gridWithMultipliers = applyMultipliers(newGrid);
        setGridTiles(gridWithMultipliers);
        const words = detectWords(gridWithMultipliers, claimedWords);
        console.log('Detected words:', words);
        setDetectedWords(words);

        // Call completion callback if provided
        if (onComplete) {
          onComplete(gridWithMultipliers);
        }
      }
    };

    step();
  };

  // Execute the world's turn
  const performWorldTurn = (currentGrid: (Tile | null)[]) => {
    // Delay slightly so player can see their turn complete
    setTimeout(() => {
      setTurn('world');

      // Execute world turn
      const result = executeWorldTurn(currentGrid, worldSeed, worldTurnCount);

      if (result) {
        console.log(`World placed ${result.tile.letter} in column ${result.column}`);

        // Increment world turn count
        incrementWorldTurnCount();

        // Apply gravity to world's placement
        animateGravity(result.grid, (finalGrid) => {
          // After world's gravity settles, check if world formed any NEW words
          const wordsAfter = detectWords(finalGrid, claimedWords);
          const wordsBefore = detectWords(currentGrid, claimedWords);

          // Find NEW words that weren't present before the world's turn
          const newWords = wordsAfter.filter(afterWord => {
            // Check if this exact word (same indices pattern) existed before
            return !wordsBefore.some(beforeWord =>
              beforeWord.direction === afterWord.direction &&
              beforeWord.indices.length === afterWord.indices.length &&
              beforeWord.indices.every((idx, i) => idx === afterWord.indices[i])
            );
          });

          if (newWords.length > 0) {
            // World formed NEW words! Calculate score and deduct from player
            const worldScore = calculateWordChainScore(newWords, finalGrid);
            console.log(`World formed NEW words worth ${worldScore} points!`, newWords.map(w => w.word));
            addScore(-worldScore); // Negative score

            // Remove world's word tiles from grid
            const indicesToRemove = getUniqueIndicesFromWords(newWords);
            const newGrid = [...finalGrid];
            indicesToRemove.forEach(idx => {
              newGrid[idx] = null;
            });

            // Apply gravity again after removing world's words
            setGridTiles(newGrid);
            animateGravity(newGrid, () => {
              // After final gravity, return turn to player
              setTurn('player');
            });
          } else {
            // No NEW words formed, just return turn to player
            console.log('World did not form any new words - existing words remain safe');
            setTurn('player');
          }
        });
      } else {
        // World couldn't play (grid full), return to player
        console.log('World could not play - grid full');
        setTurn('player');
      }
    }, 500);
  };

  const handleDragStartFromHand = (tile: Tile, index: number) => {
    setDraggedTile(tile);
    setDragSource({ type: 'hand', index });
  };

  const handleDropOnGrid = (gridIndex: number) => {
    if (draggedTile && dragSource && dragSource.type === 'hand' && currentTurn === 'player') {
      // Add tile to grid at the dropped position
      const newGrid = [...gridTiles];
      newGrid[gridIndex] = draggedTile;
      setGridTiles(newGrid);

      // Replace the tile in hand with a new one from the bag (if available)
      const newHand = [...playerHand];
      const isLastTile = letterBag.length === 0;

      if (letterBag.length > 0) {
        const { drawn, remaining } = drawTiles(letterBag, 1);
        newHand[dragSource.index] = drawn[0];
        setLetterBag(remaining);
      } else {
        newHand[dragSource.index] = null;
      }
      setPlayerHand(newHand);

      // Animate gravity to make tiles fall down
      animateGravity(newGrid, (finalGrid) => {
        // After player's gravity settles, trigger world's turn
        // But only if player still has tiles left
        if (!isLastTile) {
          performWorldTurn(finalGrid);
        } else {
          console.log('Game Over - Player bag is empty!');
          setGameOver(true);
          setTurn('player'); // Keep it on player to prevent further actions
        }
      });

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

  const handleTileClick = (tileIndex: number) => {
    // Find all connected words starting from this tile
    const connectedWords = findConnectedWordChain(tileIndex, detectedWords);

    if (connectedWords.length === 0) return;

    // Calculate score for the word chain (passing the current grid to access multipliers)
    const chainScore = calculateWordChainScore(connectedWords, gridTiles);
    addScore(chainScore);

    // Add these words to the claimed words list so they remain valid even if invalidated later
    addClaimedWords(connectedWords);

    // Get all unique tile indices to remove
    const indicesToRemove = getUniqueIndicesFromWords(connectedWords);

    // Log the claimed words for feedback
    console.log(`Claimed ${connectedWords.length} word(s):`, connectedWords.map(w => w.word).join(', '));
    console.log(`Score: +${chainScore} points`);

    // Remove the tiles from the grid
    const newGrid = [...gridTiles];
    indicesToRemove.forEach(idx => {
      newGrid[idx] = null;
    });

    // Apply gravity and detect new words
    setGridTiles(newGrid);
    animateGravity(newGrid);
  };

  return (
    <main className="bg-neutral-800/50 border-neutral-900/30 border-8 border-y-0 h-screen max-w-2xl m-auto flex flex-col items-center relative">
      <header className="mb-2 mt-2">
        <h1 className="text-2xl lg:text-5xl font-bold">Word Gravity</h1>
      </header>

      {gameOver && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
          <h1 className="text-5xl font-bold text-white mb-4">Game Over!</h1>
          <h2 className="text-3xl text-yellow-400 mb-2">Final Score: {score}</h2>
          <p className="text-xl text-gray-300">All letters used!</p>
        </div>
      )}

      <div className="flex flex-col items-center gap-1 text-sm lg:text-lg">
        <div className="flex gap-1">
          <h2>Players Today:</h2>
          <h2 className="font-bold">0</h2> {/* this needs to be replaced with global player count later */}
        </div>
        <div className="flex gap-1">
          <h2>Today's Seed:</h2>
          <h2 className="font-bold">{worldSeed}</h2>
        </div>
        <div className="flex gap-1 text-2xl">
          <h2 className="">Score:</h2>
          <h2 className="font-bold text-yellow-400">{score}</h2>
        </div>
      </div>

      <div className="mt-4">
        <WordGrid tiles={gridTiles} onDrop={handleDropOnGrid} onTileClick={handleTileClick} detectedWords={detectedWords} />
      </div>

      <div className="mt-2 flex flex-row gap-1 text-sm lg:text-lg">
        <h1>Current Turn:</h1>
        <h1 className={`font-semibold ${currentTurn === 'player' ? 'text-green-400' : 'text-red-400'}`}>
          {currentTurn.toUpperCase()}
        </h1>
      </div>

      <div className="mt-8">
        <PlayerHand tiles={playerHand} onDragStart={handleDragStartFromHand} />
      </div>

      <div
        className={`flex flex-col items-center my-4 px-16 py-2 rounded-2xl border-4 transition-all ${isSwapZoneHovered && swapsRemaining > 0
            ? 'bg-blue-500/30 border-blue-400/80 shadow-lg shadow-blue-500/50'
            : 'bg-gray-400/10 border-neutral-900/60'
          }`}
        onDragOver={handleSwapZoneDragOver}
        onDragLeave={handleSwapZoneDragLeave}
        onDrop={handleSwapZoneDrop}
      >
        <h1 className="flex gap-1 text-sm lg:text-xl font-bold text-blue-200">
          Swaps Remaining:
          <p>
            {swapsRemaining}
          </p>
        </h1>
        <div className="mt-2 flex gap-1 text-sm lg:text-xl">
          <h2>Letters Remaining:</h2>
          <h2 className="font-semibold">{letterBag.length}</h2>
        </div>
      </div>
    </main>
  );
}

export default App;
