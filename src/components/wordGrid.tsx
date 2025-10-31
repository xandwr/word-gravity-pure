// components/wordGrid.tsx

import LetterSlot from "./letterSlot";

const GRID_COLS = 7
const GRID_ROWS = 6

export default function WordGrid({ }) {
    let numberOfSlots = GRID_COLS * GRID_ROWS;

    return (
        <div
            className="grid gap-0.5 w-min h-min"
            style={{
                gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
            }}
        >
            {Array.from({ length: numberOfSlots }).map((_, index) => (
                <LetterSlot key={index} index={index} />
            ))}
        </div>
    );
}