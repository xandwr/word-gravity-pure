<script>
    import LetterSlot from "./letterSlot.svelte";
</script>

<div class="grid grid-cols-4 grid-rows-2 gap-1 w-fit h-fit">
    {#each Array(8) as _, index}
        <LetterSlot {index} />
    {/each}
</div>
