// wordGrid.tsx
"use client";
import { useGame } from "../context/GameContext";
import LetterSlot from "./letterSlot";

export default function WordGrid({ }) {
    const { boardCols, setBoardCols } = useGame();
    const { boardRows, setBoardRows } = useGame();

    const numberOfSlots = boardCols * boardRows;

    return (
        <div
            className="grid w-min h-min m-auto gap-0.5"
            style={{
                gridTemplateColumns: `repeat(${boardCols}, 1fr)`,
                gridTemplateRows: `repeat(${boardRows}, 1fr)`
            }}
        >
            {Array.from({ length: numberOfSlots }).map((_, index) => (
                <LetterSlot key={index} index={index} />
            ))}
        </div>
    );
}