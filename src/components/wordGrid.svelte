<!-- 
    components/wordGrid.svelte
-->

<script>
    import LetterSlot from "./letterSlot.svelte";

    const GRID_COLS = 7;
    const GRID_ROWS = 6;
    const totalSlots = GRID_COLS * GRID_ROWS;
</script>

<div class="grid grid-cols-7 grid-rows-6 gap-px w-fit h-fit">
    {#each Array(GRID_COLS * GRID_ROWS) as _, index}
        <LetterSlot {index} />
    {/each}
</div>
