<!-- 
    +page.svelte
-->

<script>
    import WordGrid from "../components/wordGrid.svelte";
    import PlayerHand from "../components/playerHand.svelte";
    import { gameState, HAND_CONFIG } from "$lib/game/state.svelte";
    import PlayerInfoPanel from "../components/playerInfoPanel.svelte";
</script>

<main class="flex flex-col justify-between overflow-x-hidden">
    <header
        class="flex flex-col items-center bg-blue-800 text-white p-2 sm:p-3 border-b-2 sm:border-b-4 border-blue-950 shadow-lg"
    >
        <h1 class="font-bold text-2xl sm:text-3xl md:text-4xl">Word Gravity</h1>
    </header>

    <div class="flex flex-col">
        <div class="w-full h-full p-2 sm:p-3 md:p-4 flex justify-center">
            <WordGrid />
        </div>

        <div
            class="relative flex items-center gap-1 text-sm sm:text-base md:text-xl justify-center sm:p-4 overflow-hidden rounded-md"
        >
            <!-- animated caution-tape background -->
            <div
                class="absolute inset-0 bg-size-[40px_40px] animate-banner"
                style="background-image: linear-gradient(45deg, {gameState.currentPlayerTurn === 'player' ? '#22c55e' : '#ef4444'} 25%, transparent 25%, transparent 50%, {gameState.currentPlayerTurn === 'player' ? '#22c55e' : '#ef4444'} 50%, {gameState.currentPlayerTurn === 'player' ? '#22c55e' : '#ef4444'} 75%, transparent 75%, transparent)"
            ></div>

            <h1 class="relative z-10 font-semibold">Current Turn:</h1>
            <h1 class="relative z-10 font-bold uppercase">
                {gameState.currentPlayerTurn}
            </h1>
        </div>

        <div
            class="flex justify-center px-2 py-0.5 bg-gray-400/40 border-y-4 border-black/20"
        >
            <div
                class="flex flex-col sm:flex-row justify-center sm:justify-between gap-2 sm:gap-4 w-full max-w-md"
            >
                <PlayerInfoPanel player="player" />
                <PlayerInfoPanel player="opponent" />
            </div>
        </div>

        <div
            class="w-full h-full p-2 sm:p-3 md:p-4 flex justify-center bg-gray-500/10"
        >
            <PlayerHand />
        </div>
    </div>
</main>

<style>
    @keyframes bannerScroll {
        from {
            background-position: 0 0;
        }
        to {
            background-position: 40px 0;
        }
    }
    .animate-banner {
        animation: bannerScroll 1s linear infinite;
        opacity: 0.2; /* adjust so text stays readable */
    }
</style>
