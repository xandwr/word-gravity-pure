import WordGrid from "./components/wordGrid"
import PlayerHand from "./components/playerHand"

function App() {
  return (
    <>
      <div className="flex flex-col justify-center items-center">
        <WordGrid />
        <PlayerHand />
      </div>
    </>
  )
}

export default App
