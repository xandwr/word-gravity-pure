// App.tsx

import { useState, useEffect } from "react";
import WordGrid from "./components/WordGrid";
import PlayerHand from "./components/PlayerHand";
import type { Tile } from "./utils/letterBag";
import { createLetterBag, drawTiles } from "./utils/letterBag";
import { detectWords, loadDictionary, type WordMatch, getUniqueIndicesFromWords, calculateWordChainScore, filterClaimableWords } from "./utils/wordDetection";
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
  const [claimTimer, setClaimTimer] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(5);

  // Initialize the game on launch
  useEffect(() => {
    // Load dictionary first
    loadDictionary().then(() => {
      // Set today's seed for deterministic gameplay
      const seed = getTodaysSeed();
      setWorldSeed(seed);

      // Create deterministic letter bag using the same seed
      const bag = createLetterBag(seed);
      const { drawn, remaining } = drawTiles(bag, 8);
      setPlayerHand(drawn);
      setLetterBag(remaining);
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

  // Start the claim timer for player
  const startClaimTimer = (currentGrid: (Tile | null)[], isLastTile: boolean) => {
    // Set turn to player so they can click words
    setTurn('player');

    let secondsLeft = 5;
    setTimeRemaining(secondsLeft);

    const timerId = window.setInterval(() => {
      secondsLeft -= 1;
      setTimeRemaining(secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(timerId);
        setClaimTimer(null);
        console.log('Timer expired - player skipped claiming');

        // Timer expired, move to world turn or end game
        if (!isLastTile) {
          performWorldTurn(currentGrid);
        } else {
          console.log('Game Over - Player bag is empty!');
          setGameOver(true);
          setTurn('player');
        }
      }
    }, 1000);

    setClaimTimer(timerId);
  };

  // Cancel the claim timer
  const cancelClaimTimer = () => {
    if (claimTimer !== null) {
      clearInterval(claimTimer);
      setClaimTimer(null);
      setTimeRemaining(5);
    }
  };

  // Check if player can claim any words at the start of their turn
  const checkForPlayerClaimableWords = (currentGrid: (Tile | null)[]) => {
    const allWords = detectWords(currentGrid, claimedWords);
    const playerWords = filterClaimableWords(allWords, currentGrid, 'player');

    if (playerWords.length > 0) {
      console.log(`Player can claim ${playerWords.length} existing word(s) before placing:`, playerWords.map(w => w.word).join(', '));
      setDetectedWords(allWords);
      setTimeRemaining(5);

      // Start timer with isLastTile check
      const isLastTile = letterBag.length === 0;
      startClaimTimer(currentGrid, isLastTile);
    } else {
      // No claimable words, just clear detected words
      setDetectedWords([]);
    }
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
          // After world's gravity settles, evaluate any words formed with cascading
          setTimeout(() => {
            evaluateWorldCascade(finalGrid);
          }, 300);
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
      // IMMEDIATELY lock the player out by setting turn to 'world'
      // This prevents any quick double-placements
      setTurn('world');

      // Add tile to grid at the dropped position, marking it as placed by player
      const newGrid = [...gridTiles];
      newGrid[gridIndex] = { ...draggedTile, placedBy: 'player' };
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

      setDraggedTile(null);
      setDragSource(null);

      // Animate gravity to make tiles fall down
      animateGravity(newGrid, (finalGrid) => {
        // After player's gravity settles, detect words and start timer
        setTimeout(() => {
          const words = detectWords(finalGrid, claimedWords);
          setDetectedWords(words);

          if (words.length > 0) {
            // Start 5 second timer for player to claim
            console.log('Player has 5 seconds to claim words or skip');
            setTimeRemaining(5);
            startClaimTimer(finalGrid, isLastTile);
          } else {
            // No words formed, immediately go to world turn or end game
            if (!isLastTile) {
              performWorldTurn(finalGrid);
            } else {
              console.log('Game Over - Player bag is empty!');
              setGameOver(true);
              setTurn('player');
            }
          }
        }, 300);
      });
    }
  };

  const handleSwap = () => {
    if (draggedTile && dragSource && dragSource.type === 'hand' && swapsRemaining > 0 && letterBag.length > 0 && currentTurn === 'player') {
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
    if (draggedTile && dragSource?.type === 'hand' && swapsRemaining > 0 && currentTurn === 'player') {
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

  // World cascade: automatically claims words that extend player's words
  const evaluateWorldCascade = (currentGrid: (Tile | null)[]) => {
    const allWords = detectWords(currentGrid, claimedWords);
    console.log(`World evaluation: ${allWords.length} total words detected:`, allWords.map(w => w.word).join(', '));

    // Debug: Check tile ownership for each word
    allWords.forEach(word => {
      const owners = word.indices.map(idx => {
        const tile = currentGrid[idx];
        return tile?.placedBy || 'none';
      });
      console.log(`  "${word.word}" ownership: [${owners.join(', ')}]`);
    });

    // World can only claim words that contain at least one world-placed tile
    const claimableWords = filterClaimableWords(allWords, currentGrid, 'world');

    if (claimableWords.length === 0) {
      console.log('World has no words to claim - returning to player');
      finalizeWorldTurn(currentGrid);
      return;
    }

    // Calculate score for claimable words
    const chainScore = calculateWordChainScore(claimableWords, currentGrid);
    addScore(-chainScore);
    console.log(`World claims ${claimableWords.length} word(s): ${claimableWords.map(w => w.word).join(', ')} (-${chainScore} points)`);

    // Add to claimed words
    addClaimedWords(claimableWords);

    // Remove tiles
    const indicesToRemove = getUniqueIndicesFromWords(claimableWords);
    setTimeout(() => {
      const newGrid = [...currentGrid];
      indicesToRemove.forEach(idx => {
        newGrid[idx] = null;
      });

      // Don't clear placedBy markers - they persist for multi-turn word building
      // This allows proper ownership tracking across multiple turns

      // Apply gravity and continue cascade
      setGridTiles(newGrid);
      animateGravity(newGrid, (finalGrid) => {
        setTimeout(() => {
          evaluateWorldCascade(finalGrid);
        }, 300);
      });
    }, 500);
  };

  // After world cascade completes, check if player can claim existing words
  const finalizeWorldTurn = (currentGrid: (Tile | null)[]) => {
    setTurn('player');
    checkForPlayerClaimableWords(currentGrid);
  };

  // Player cascade: evaluates after manual claim
  const evaluateWordCascade = (
    currentGrid: (Tile | null)[],
    isPlayerTurn: boolean = true,
    isLastTile: boolean = false,
    onComplete?: (finalGrid: (Tile | null)[]) => void
  ) => {
    const allWords = detectWords(currentGrid, claimedWords);
    console.log(`Player cascade: ${allWords.length} total words detected:`, allWords.map(w => w.word).join(', '));

    // Debug: Check tile ownership for each word
    allWords.forEach(word => {
      const owners = word.indices.map(idx => {
        const tile = currentGrid[idx];
        return tile?.placedBy || 'none';
      });
      console.log(`  "${word.word}" ownership: [${owners.join(', ')}]`);
    });

    // Filter to only words that contain at least one tile placed by the current player
    const currentPlayer = isPlayerTurn ? 'player' : 'world';
    const claimableWords = filterClaimableWords(allWords, currentGrid, currentPlayer);

    if (claimableWords.length === 0) {
      console.log('Player cascade: No more words to evaluate - cascade complete');
      if (onComplete) {
        onComplete(currentGrid);
      }
      return;
    }

    // Automatically claim all valid words found that contain tiles from current player
    console.log(`Found ${claimableWords.length} claimable word(s):`, claimableWords.map(w => w.word).join(', '));
    if (allWords.length > claimableWords.length) {
      console.log(`(${allWords.length - claimableWords.length} words detected but not claimable by ${currentPlayer})`);
    }

    // Calculate score for claimable words only
    const chainScore = calculateWordChainScore(claimableWords, currentGrid);

    if (isPlayerTurn) {
      addScore(chainScore);
      console.log(`Player claims +${chainScore} points`);
    } else {
      addScore(-chainScore);
      console.log(`World claims -${chainScore} points`);
    }

    // Add these words to the claimed words list
    addClaimedWords(claimableWords);

    // Get all unique tile indices to remove
    const indicesToRemove = getUniqueIndicesFromWords(claimableWords);

    // Remove the tiles from the grid with a visual delay
    setTimeout(() => {
      const newGrid = [...currentGrid];
      indicesToRemove.forEach(idx => {
        newGrid[idx] = null;
      });

      // Don't clear placedBy markers - they persist for multi-turn word building
      // This allows proper ownership tracking across multiple turns

      // Apply gravity and continue cascade
      setGridTiles(newGrid);
      animateGravity(newGrid, (finalGrid) => {
        // After gravity settles, check for more words
        setTimeout(() => {
          evaluateWordCascade(finalGrid, isPlayerTurn, isLastTile, onComplete);
        }, 300); // Delay before next evaluation
      });
    }, 500); // Visual delay before removing tiles
  };

  const handleTileClick = (tileIndex: number) => {
    console.log(`Tile clicked at index ${tileIndex}, currentTurn: ${currentTurn}, timer: ${claimTimer !== null}`);

    // Only allow clicking during player's turn with timer active
    if (currentTurn !== 'player' || claimTimer === null) {
      console.log('Click rejected: not player turn or no timer');
      return;
    }

    // Find which word(s) contain this tile
    const wordsContainingTile = detectedWords.filter(word =>
      word.indices.includes(tileIndex)
    );

    console.log(`Found ${wordsContainingTile.length} words containing this tile`);

    if (wordsContainingTile.length === 0) {
      console.log('No valid word at this tile');
      return;
    }

    // Cancel the timer
    cancelClaimTimer();

    // Start the claiming cascade
    console.log('Player manually claimed word(s):', wordsContainingTile.map(w => w.word).join(', '));

    // Check if this is the last tile in player's bag
    const isLastTile = letterBag.length === 0;

    evaluateWordCascade(gridTiles, true, isLastTile, (finalGrid) => {
      // After cascade completes, trigger world's turn or end game
      if (!isLastTile) {
        performWorldTurn(finalGrid);
      } else {
        console.log('Game Over - Player bag is empty!');
        setGameOver(true);
        setTurn('player');
      }
    });
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

      <div className="mt-2 flex flex-col items-center gap-2">
        <div className="flex flex-row gap-1 text-sm lg:text-lg">
          <h1>Current Turn:</h1>
          <h1 className={`font-semibold ${currentTurn === 'player' ? 'text-green-400' : 'text-red-400'}`}>
            {currentTurn.toUpperCase()}
          </h1>
        </div>

        {claimTimer !== null && detectedWords.length > 0 && (
          <div className="bg-yellow-500/20 border-2 border-yellow-400 rounded-lg px-6 py-3 animate-pulse">
            <p className="text-lg font-bold text-yellow-200">
              Click a word to claim it! Time: {timeRemaining}s
            </p>
            <p className="text-sm text-yellow-300 mt-1">
              Or wait to skip and let the world play
            </p>
          </div>
        )}
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
