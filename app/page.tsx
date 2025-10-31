import WordGrid from "./components/wordGrid";
import PlayerHand from "./components/playerHand";

export default function Home() {
  return (
    <div className="flex flex-col gap-4">
      <WordGrid />
      <PlayerHand />
    </div>
  );
}
