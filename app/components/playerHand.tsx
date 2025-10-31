"use client";
import LetterSlot from "./letterSlot";
import { useMediaQuery } from "../hooks/useMediaQuery";

export default function PlayerHand() {
    const playerHandSize = 8;

    const isMobile = useMediaQuery("(max-width: 640px)"); // Tailwind's sm breakpoint

    const numberOfCols = isMobile ? 4 : 8;
    const numberOfRows = isMobile ? 2 : 1;

    return (
        <div
            className="grid m-auto gap-0.5"
            style={{
                gridTemplateColumns: `repeat(${numberOfCols}, 1fr)`,
                gridTemplateRows: `repeat(${numberOfRows}, 1fr)`
            }}
        >
            {Array.from({ length: playerHandSize }).map((_, index) => (
                <LetterSlot key={index} index={index} />
            ))}
        </div>
    );
}
