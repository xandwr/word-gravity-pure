<!--
    components/letterTile.svelte
-->

<script lang="ts">
    import type { TileData } from "$lib/game/types";

    interface Props {
        tile: TileData;
    }

    let { tile }: Props = $props();
</script>

<div
    id="letterTile"
    class="aspect-square rounded-xl border-4 bg-orange-200 flex flex-col items-center justify-center w-10 h-10 p-8"
>
    <h class="text-4xl font-bold">{tile.letter}</h>
    <span class="flex flex-row gap-1 items-center">
        <h class="text-md font-semibold">{tile.baseScore}</h>
        <p class="text-sm">x</p>
        <h class="text-md font-semibold">{tile.multiplier}</h>
    </span>
</div>
