import WordGrid from "./components/wordGrid";
import PlayerHand from "./components/playerHand";

export default function Home() {
  return (
    <div className="flex flex-col">
      <div className="bg-red-300 p-4">
        <WordGrid />
      </div>
      
      <div className="bg-blue-300 px-8 py-2">
        <PlayerHand />
      </div>
      
    </div>
  );
}
