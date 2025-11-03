<!--
    +page.svelte
-->

<script lang="ts">
    import WordGrid from "../components/wordGrid.svelte";
    import PlayerHand from "../components/playerHand.svelte";
    import { gameState, HAND_CONFIG } from "$lib/game/state.svelte";
    import PlayerInfoPanel from "../components/playerInfoPanel.svelte";
    import { PLAYER_COLORS } from "$lib/game/constants";

    let username = $state("");
    let submitting = $state(false);
    let submitSuccess = $state(false);
    let submitError = $state("");
    let playerRank = $state<number | null>(null);

    async function submitScore() {
        if (!username.trim()) {
            submitError = "Please enter a username";
            return;
        }

        submitting = true;
        submitError = "";

        try {
            const response = await fetch("/api/leaderboard", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username.trim(),
                    score: gameState.playerScore,
                }),
            });

            const data = await response.json();

            if (data.success) {
                submitSuccess = true;
                playerRank = data.rank;
            } else {
                submitError = data.error || "Failed to submit score";
            }
        } catch (error) {
            submitError = "Network error. Please try again.";
            console.error("Submit error:", error);
        } finally {
            submitting = false;
        }
    }
</script>

<svelte:head>
    <title>Word Gravity | Endless</title>
</svelte:head>

<div class="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
    {#if gameState.isGameOver}
        <div
            class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        >
            <div
                class="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full shadow-2xl"
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

                {#if !submitSuccess}
                    <div class="mb-4">
                        <label
                            for="username"
                            class="block text-sm font-semibold mb-2"
                        >
                            Submit your score to the leaderboard:
                        </label>
                        <input
                            id="username"
                            type="text"
                            bind:value={username}
                            placeholder="Enter your username"
                            maxlength="20"
                            class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            disabled={submitting}
                        />
                        {#if submitError}
                            <p class="text-red-600 text-sm mt-2">
                                {submitError}
                            </p>
                        {/if}
                    </div>

                    <button
                        class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        onclick={submitScore}
                        disabled={submitting || !username.trim()}
                    >
                        {submitting ? "Submitting..." : "Submit Score"}
                    </button>
                {:else}
                    <div
                        class="mb-4 p-4 bg-green-100 border-2 border-green-500 rounded-lg text-center"
                    >
                        <p class="text-green-800 font-bold mb-1">
                            Score submitted!
                        </p>
                        {#if playerRank !== null}
                            <p class="text-green-700">
                                You ranked #{playerRank} on the leaderboard!
                            </p>
                        {/if}
                    </div>

                    <a
                        href="/leaderboard"
                        class="block w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-center mb-3"
                    >
                        View Leaderboard
                    </a>
                {/if}

                <button
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    onclick={() => window.location.reload()}
                >
                    Play Again
                </button>
            </div>
        </div>
    {/if}

    <div class="relative flex flex-col flex-1 min-h-0">
        <div id="gameBackground" class="absolute inset-0 -z-10">
            
        </div>
        
        <div class="flex-1 w-full py-1 px-2 sm:py-2 sm:px-3 flex justify-center items-center overflow-auto">
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
                class="relative z-10 flex flex-row justify-between items-center gap-2 sm:gap-4 w-full"
            >
                <PlayerInfoPanel player="player" />

                <div class="flex flex-col items-center gap-1 shrink-0">
                    <div
                        class="flex items-center gap-1 text-xl uppercase whitespace-nowrap"
                    >
                        <span class="font-semibold">Turn:</span>
                        <span class="font-bold drop-shadow-[0px_1px_1px_black]" style="color: {PLAYER_COLORS[gameState.currentPlayerTurn].primary};"
                            >{gameState.currentPlayerTurn == "player" ? "You" : "Them"}</span
                        >
                    </div>
                    <div
                        class="flex items-center gap-1 text-xs sm:text-base whitespace-nowrap bg-gray-800/20 border-2 border-black/10 px-4 py-1 rounded-lg"
                    >
                        <span class="font-semibold">Letters:</span>
                        <span class="font-bold">{gameState.bagCount}</span>
                    </div>
                </div>

                <PlayerInfoPanel player="opponent" />
            </div>
        </div>

        <div class="relative shrink-0">
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
        animation: bannerScroll 2s linear infinite;
        opacity: 0.15; /* adjust so text stays readable */
    }
</style>
