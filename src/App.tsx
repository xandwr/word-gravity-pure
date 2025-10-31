import WordGrid from "./components/wordGrid"
import PlayerHand from "./components/playerHand"
import LetterTile from "./components/letterTile";
import { useGameStore } from "./store/gameStore"

function App() {
  const { score, addScore } = useGameStore();

  return (
    <>
    <LetterTile />
      <div className="flex flex-col justify-center items-center">
        <WordGrid />
        <div className="mt-8"><PlayerHand /></div>
        <h1>Score: {score}</h1>
      </div>
    </>
  )
}

export default App
