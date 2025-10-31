// components/playerHand.tsx
import LetterSlot from "./letterSlot";

export default function PlayerHand({ }) {
    let numberOfSlots = 8;

    return (
        <div className="flex">
            {Array.from({ length: numberOfSlots }).map((_, index) => (
                <LetterSlot key={index} index={index} />
            ))}
        </div>
    );
}