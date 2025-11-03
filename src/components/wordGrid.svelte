<!--
    components/wordGrid.svelte
-->

<script lang="ts">
    import LetterSlot from "./letterSlot.svelte";
    import { gameState, BOARD_CONFIG } from "$lib/game/state.svelte";
</script>

<div>
    <h1 class="text-xl sm:text-2xl font-semibold text-center mb-2 tracking-tight">Endless Mode</h1>
    <div
        class="grid gap-px w-fit max-w-full sm:max-w-[90vw] md:max-w-[728px] h-fit mx-auto"
        style="grid-template-columns: repeat({BOARD_CONFIG.COLS}, minmax(0, 1fr)); grid-template-rows: repeat({BOARD_CONFIG.ROWS}, minmax(0, 1fr));"
    >
        {#each gameState.board as slot, index}
            <LetterSlot {index} tile={slot.heldLetterTile} slotType="board" />
        {/each}
    </div>
</div>
