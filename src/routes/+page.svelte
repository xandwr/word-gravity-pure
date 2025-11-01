<!-- 
    +page.svelte
-->

<script>
    import WordGrid from "../components/wordGrid.svelte";
    import PlayerHand from "../components/playerHand.svelte";
    import { gameState, HAND_CONFIG } from "$lib/game/state.svelte";
    import PlayerInfoPanel from "../components/playerInfoPanel.svelte";
</script>

<main class="flex flex-col min-h-screen overflow-x-hidden">
    <header
        class="flex flex-col items-center bg-blue-800 text-white p-2 sm:p-3 border-b-2 sm:border-b-4 border-blue-950 shadow-lg"
    >
        <h1 class="font-bold text-2xl sm:text-3xl md:text-4xl">Word Gravity</h1>
    </header>

    {#if gameState.isGameOver}
        <div
            class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
        >
            <div
                class="bg-white rounded-lg p-6 sm:p-8 max-w-md mx-4 shadow-2xl"
            >
                <h2 class="text-2xl sm:text-3xl font-bold text-center mb-4">
                    Game Over!
                </h2>
                <p class="text-center mb-6">{gameState.gameOverReason}</p>
                <div class="flex flex-col gap-2 mb-6">
                    <div class="flex justify-between text-lg">
                        <span class="font-semibold">Your Score:</span>
                        <span class="font-bold text-green-600"
                            >{gameState.playerScore}</span
                        >
                    </div>
                    <div class="flex justify-between text-lg">
                        <span class="font-semibold">Opponent Score:</span>
                        <span class="font-bold text-red-600"
                            >{gameState.opponentScore}</span
                        >
                    </div>
                </div>
                <button
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    onclick={() => window.location.reload()}
                >
                    Play Again
                </button>
            </div>
        </div>
    {/if}

    <div class="flex flex-col flex-1">
        <div class="w-full h-full p-2 sm:p-3 md:p-4 flex justify-center">
            <WordGrid />
        </div>

        <div
            class="relative flex justify-center px-2 py-0.5 border-y-4 border-black/20 overflow-hidden"
        >
            <!-- animated caution-tape background -->
            <div
                class="absolute inset-0 bg-size-[40px_40px] animate-banner"
                style="background-image: linear-gradient(45deg, {gameState.currentPlayerTurn ===
                'player'
                    ? '#22c55e'
                    : '#ef4444'} 35%, transparent 35%, transparent 50%, {gameState.currentPlayerTurn ===
                'player'
                    ? '#22c55e'
                    : '#ef4444'} 50%, {gameState.currentPlayerTurn === 'player'
                    ? '#22c55e'
                    : '#ef4444'} 85%, transparent 85%, transparent)"
            ></div>

            <div
                class="relative z-10 flex flex-row justify-center sm:justify-between items-center gap-2 sm:gap-4 w-full max-w-md"
            >
                <PlayerInfoPanel player="player" />

                <div
                    class="flex items-center gap-1 text-xs sm:text-sm font-bold uppercase whitespace-nowrap"
                >
                    <span>Turn:</span>
                    <span>{gameState.currentPlayerTurn}</span>
                </div>

                <PlayerInfoPanel player="opponent" />
            </div>
        </div>

        <div class="relative flex-1">
            <!-- Background panel from player info to bottom of screen -->
            <div class="absolute inset-0 bg-gray-500/10"></div>

            <div class="relative w-full p-2 sm:p-3 md:p-4 flex justify-center">
                <PlayerHand />
            </div>
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
        opacity: 0.5; /* adjust so text stays readable */
    }
</style>
