// components/letterSlot.tsx

export default function LetterSlot({ index = 0 }) {
    return (
        <div className="border-2 aspect-square">
            <h1 className="text-center text-3xl">A</h1>
            <span className="flex flex-row justify-center-safe">
                <h1>1</h1>
                x
                <h1>1</h1>
            </span>
        </div>
    );
}