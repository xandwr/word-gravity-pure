<!--
    components/wordGrid.svelte
-->

<script lang="ts">
    import LetterSlot from "./letterSlot.svelte";
    import { gameState, BOARD_CONFIG } from "$lib/game/state.svelte";
</script>

<div class="grid grid-cols-{BOARD_CONFIG.COLS} grid-rows-{BOARD_CONFIG.ROWS} gap-px w-fit h-fit">
    {#each gameState.board as slot, index}
        <LetterSlot {index} tile={slot.heldLetterTile} />
    {/each}
</div>
