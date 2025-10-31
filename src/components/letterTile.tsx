// components/letterTile.tsx

export default function LetterTile() {
    return (
        <div className="aspect-square w-full max-w-10 border-2 border-white rounded-lg bg-orange-200 text-neutral-900 flex flex-col justify-center items-center p-1">
            <h1 className="text-sm font-bold leading-none">A</h1>
            <div className="flex gap-0.5 text-xs leading-none">
                <span className="font-semibold">1</span>
                <span>x</span>
                <span className="font-semibold">1</span>
            </div>
        </div>
    );
}
