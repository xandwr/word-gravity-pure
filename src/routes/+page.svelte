<!-- 
    +page.svelte
-->

<script>
    import WordGrid from "../components/wordGrid.svelte";
    import PlayerHand from "../components/playerHand.svelte";
    import { gameState, HAND_CONFIG } from "$lib/game/state.svelte";
    import PlayerInfoPanel from "../components/playerInfoPanel.svelte";
    import { PLAYER_COLORS } from "$lib/game/constants";
</script>

<div class="flex flex-col min-h-screen overflow-x-hidden">
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
            class="relative flex justify-center px-2 py-0.5 border-y-2 border-black/30 overflow-hidden shadow-lg"
        >
            <!-- animated caution-tape background -->
            <div
                class="absolute inset-0 bg-size-[40px_40px] animate-banner"
                style="background-image: linear-gradient(45deg, {PLAYER_COLORS[
                    gameState.currentPlayerTurn
                ]
                    .primary} 35%, transparent 35%, transparent 50%, {PLAYER_COLORS[
                    gameState.currentPlayerTurn
                ].primary} 50%, {PLAYER_COLORS[gameState.currentPlayerTurn]
                    .primary} 85%, transparent 85%, transparent)"
            ></div>

            <div
                class="relative z-10 flex flex-row justify-center sm:justify-between items-center gap-2 sm:gap-4 w-full max-w-md"
            >
                <PlayerInfoPanel player="player" />

                <div
                    class="flex items-center gap-1 text-sm uppercase whitespace-nowrap bg-gray-800/20 border-2 border-black/10 p-2 rounded-xl"
                >
                    <span class="font-semibold">Turn:</span>
                    <span class="font-bold">{gameState.currentPlayerTurn}</span>
                </div>

                <PlayerInfoPanel player="opponent" />
            </div>
        </div>

        <div class="relative flex-1">
            <!-- Background panel from player info to bottom of screen -->
            <div class="absolute inset-0 bg-gray-500/10"></div>

            <div class="relative px-1 py-2 sm:p-3 md:p-4 flex justify-center">
                <PlayerHand />
            </div>
        </div>
    </div>
</div>

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
