<!-- 
    components/letterTile.svelte
-->

<script>
    import { createTile } from "$lib/game/state";

    const test_tile = createTile("A", 1);
</script>

<div
    id="letterTile"
    class="aspect-square rounded-xl border-4 bg-orange-200 flex flex-col items-center justify-center w-10 h-10 p-8"
>
    <h class="text-4xl font-bold">{test_tile.letter}</h>
    <span class="flex flex-row gap-1 items-center">
        <h class="text-md font-semibold">{test_tile.baseScore}</h>
        <p class="text-sm">x</p>
        <h class="text-md font-semibold">{test_tile.multiplier}</h>
    </span>
</div>
