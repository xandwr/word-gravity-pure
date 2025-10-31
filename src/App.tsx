import WordGrid from "./components/wordGrid"
import PlayerHand from "./components/playerHand"

function App() {
  return (
    <>
      <div className="flex flex-col justify-center-safe items-center-safe">
        <WordGrid />
        <PlayerHand />
      </div>
    </>
  )
}

export default App
