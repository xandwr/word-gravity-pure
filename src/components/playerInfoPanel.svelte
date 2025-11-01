<!--
    components/playerInfoPanel.svelte
-->

<script lang="ts">
    import { gameState, HAND_CONFIG } from "$lib/game/state.svelte";

    interface Props {
        player: "player" | "opponent";
    }

    let { player }: Props = $props();

    // Compute number of letters currently in hand
    let lettersInHand = $derived(
        player === "player"
            ? gameState.playerHandSlots.filter(
                  (slot) => slot.heldLetterTile !== null,
              ).length
            : gameState.opponentHandSlots.filter(
                  (slot) => slot.heldLetterTile !== null,
              ).length,
    );

    let score = $derived(
        player === "player" ? gameState.playerScore : gameState.opponentScore,
    );

    let displayName = $derived(player === "player" ? "You" : "Opponent");
    let bgColor = $derived(player === "player" ? "bg-green-400" : "bg-red-400");
</script>

<div class="border-2 sm:border-4 px-3 sm:px-6 md:px-8 py-1 sm:py-2 rounded-xl flex flex-col items-center {bgColor}">
    <h1 class="font-bold text-base sm:text-lg md:text-xl">{displayName}</h1>

    <span class="flex gap-1 text-xs sm:text-sm md:text-base">
        <h2 class="font-semibold">Letters:</h2>
        <h2 class="font-bold">{lettersInHand} / {HAND_CONFIG.SIZE}</h2>
    </span>

    <span class="flex gap-1 text-xs sm:text-sm md:text-base">
        <h2 class="font-semibold">Score:</h2>
        <h2 class="font-bold">{score}</h2>
    </span>
</div>
