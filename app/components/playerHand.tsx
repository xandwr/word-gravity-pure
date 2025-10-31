// playerHand.tsx
"use client";
import { useGame } from "../context/GameContext";
import LetterSlot from "./letterSlot";

export default function PlayerHand({ }) {
    const numberOfSlots = 8;

    return (
        <div
            className="grid w-min h-min m-auto gap-0.5"
            style={{
                gridTemplateColumns: `repeat(${numberOfSlots}, 1fr)`,
                gridTemplateRows: `repeat(1, 1fr)`
            }}
        >
            {Array.from({ length: numberOfSlots }).map((_, index) => (
                <LetterSlot key={index} index={index} />
            ))}
        </div>
    );
}