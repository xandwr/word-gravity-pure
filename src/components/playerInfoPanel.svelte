<!--
    components/playerInfoPanel.svelte
-->

<script lang="ts">
    import { gameState, HAND_CONFIG } from "$lib/game/state.svelte";
    import { PLAYER_COLORS } from "$lib/game/constants";

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

    let displayName = $derived(PLAYER_COLORS[player].name);
    let bgColor = $derived(PLAYER_COLORS[player].tailwind);
</script>

<div
    class="flex-1 border-2 sm:border-4 px-3 sm:px-6 md:px-8 py-1 sm:py-2 rounded-xl flex flex-col items-center {bgColor} min-w-0"
>
    <h1 class="font-bold text-base sm:text-lg md:text-xl truncate w-full text-center">{displayName}</h1>

    <span class="flex gap-1 text-xs overflow-x-auto max-w-full">
        <h2 class="font-semibold">Letters:</h2>
        <h2 class="font-bold text-nowrap">
            {lettersInHand} / {HAND_CONFIG.SIZE}
        </h2>
    </span>

    <span class="flex gap-1 text-base overflow-x-auto max-w-full">
        <h2 class="font-semibold text-nowrap">Score:</h2>
        <h2 class="font-bold text-nowrap">
            {score}
        </h2>
    </span>
</div>
