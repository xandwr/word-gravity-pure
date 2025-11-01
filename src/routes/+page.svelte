<!-- 
    +page.svelte
-->

<script>
    import WordGrid from "../components/wordGrid.svelte";
    import PlayerHand from "../components/playerHand.svelte";
    import { gameState, HAND_CONFIG } from "$lib/game/state.svelte";
</script>

<main class="flex flex-col justify-between">
    <header
        class="flex flex-col items-center bg-blue-800 text-white p-3 border-b-4 border-blue-950 shadow-lg"
    >
        <h1 class="font-bold text-4xl">Word Gravity</h1>
    </header>

    <div class="flex flex-col">
        <div class="bg-red-500/20 w-full h-full p-4 flex justify-center">
            <WordGrid />
        </div>

        <div class="flex justify-center bg-orange-500/50">
            <div class="flex justify-between w-sm">
                <div
                    class="border-4 px-8 py-2 rounded-xl flex flex-col items-center bg-green-400"
                >
                    <h1 class="font-bold text-xl">You</h1>
                    <span class="flex gap-1">
                        <h2 class="font-semibold">Letters:</h2>
                        <h2 id="playerScoreText" class="font-bold">0 / {HAND_CONFIG.SIZE}</h2>
                    </span>
                </div>

                <div
                    class="border-4 px-8 py-2 rounded-xl flex flex-col items-center bg-red-400"
                >
                    <h1 class="font-bold text-xl">Opponent</h1>
                    <span class="flex gap-1">
                        <h2 class="font-semibold">Letters:</h2>
                        <h2 id="opponentScoreText" class="font-bold">0 / {HAND_CONFIG.SIZE}</h2>
                    </span>
                </div>
            </div>
        </div>

        <div class="bg-purple-500/20 w-full h-full p-4 flex justify-center">
            <PlayerHand />
        </div>

        <div class="text-xl bg-green-200 p-1 font-bold flex gap-1 justify-center">
            <h2>Letters Remaining:</h2>
            <h2>0</h2>
        </div>
    </div>
</main>
