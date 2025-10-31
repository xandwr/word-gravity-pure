// letterTile.tsx

import { TileData } from "../types";

export default function LetterTile(letterData: TileData) {
    return(
        <div className="flex flex-col items-center justify-center border-2 rounded-xl">
            <h1 className="text-xl font-bold">{letterData.letter}</h1>
        </div>
    );
}