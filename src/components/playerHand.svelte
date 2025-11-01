<!--
    components/playerHand.svelte
-->

<script lang="ts">
    import LetterSlot from "./letterSlot.svelte";
    import { playerBag } from "$lib/game/playerLetterBag.svelte";
    import { gameState, HAND_CONFIG } from "$lib/game/state.svelte";
</script>

<div class="flex gap-x-1">
    <div id="handSlots" class="grid grid-cols-4 grid-rows-2 gap-1 w-fit h-fit">
        {#each gameState.hand as slot, index}
            <LetterSlot {index} tile={slot.heldLetterTile} />
        {/each}
    </div>

    <div
        id="swapButton"
        class="aspect-square rounded-xl border-4 bg-blue-200 flex flex-col items-center justify-center p-4"
    >
        <h1 class="text-4xl">🔁</h1>
        <h1 class="text-xl font-bold">Swap</h1>
        <span class="flex gap-1">
            <h1 class="font-semibold">Remaining:</h1>
            <h1 class="font-bold">{gameState.swapsRemaining}</h1>
        </span>
    </div>
</div>
