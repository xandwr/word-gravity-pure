<!--
    components/playerHand.svelte
-->

<script lang="ts">
    import { onMount } from "svelte";
    import LetterSlot from "./letterSlot.svelte";
    import { playerBag } from "$lib/game/playerLetterBag.svelte";
    import { gameState, HAND_CONFIG } from "$lib/game/state.svelte";

    // Populate the player's hand when the component mounts
    onMount(() => {
        const tiles = gameState.playerFreshHand();
        if (tiles) {
            tiles.forEach((tile, index) => {
                gameState.setHandSlot(index, tile);
            });
        }
    });
</script>

<div>
    <div class="flex gap-x-1 bg-purple-500">
        <div
            id="handSlots"
            class="grid grid-cols-4 grid-rows-2 gap-1 w-fit h-fit"
        >
            {#each gameState.hand as slot, index}
                <LetterSlot {index} tile={slot.heldLetterTile} />
            {/each}
        </div>

        <div class="flex flex-col items-center justify-center">
            <div
                id="swapButton"
                class="aspect-square rounded-xl border-4 bg-blue-200 flex flex-col items-center justify-center p-4"
            >
                <h1 class="text-4xl">🔁</h1>
                <h1 class="text-xl font-bold">Swap</h1>
                <span class="flex gap-1">
                    <h1 class="font-semibold">Remaining:</h1>
                    <h1 class="font-bold">{gameState.playerSwapsRemaining}</h1>
                </span>
            </div>
        </div>
    </div>

    <div class="text-xl bg-green-200 p-1 font-bold flex gap-1 justify-center">
        <h2>Letters Remaining:</h2>
        <h2>{playerBag.length}</h2>
    </div>
</div>
