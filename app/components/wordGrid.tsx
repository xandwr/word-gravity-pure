// wordGrid.tsx
"use client";
import { useGame } from "../context/GameContext";

export default function WordGrid({ }) {
    const {score, setScore} = useGame();
    const {boardCols, setBoardCols} = useGame();
    const {boardRows, setBoardRows} = useGame();

    return (
        <div className="flex flex-col">
            <h1>Score: {score}</h1>
            <h1>Board cols: {boardCols}</h1>
            <h1>Board rows: {boardRows}</h1>
        </div>
    );
}