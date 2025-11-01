<script>
    import { createTile } from "$lib/game/state";

    const test_tile = createTile("A", 1);
</script>

<div id="letterTile" class="border-2 bg-orange-200 text-black/80 w-full aspect-square flex flex-col items-center">
    <h class="text-xl">{test_tile.letter}</h>
    <span class="flex flex-row gap-1">
        <h class="text-md">{test_tile.baseScore}</h>
        <p>x</p>
        <h class="text-md">{test_tile.multiplier}</h>
    </span>
</div>