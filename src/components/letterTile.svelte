<!--
    components/letterTile.svelte
-->

<script lang="ts">
    import type { TileData, TileHighlight } from "$lib/game/types";

    interface Props {
        tile: TileData;
        highlight?: TileHighlight;
    }

    let { tile, highlight = "none" }: Props = $props();

    // Determine background color based on highlight
    const bgColor = $derived(() => {
        switch (highlight) {
            case "horizontal":
                return "bg-blue-300 text-blue-900";
            case "vertical":
                return "bg-orange-300 text-orange-900";
            case "intersection":
                return "bg-purple-300 text-purple-900";
            case "opponent-owned":
                return "bg-red-300 text-red-900";
            default:
                return "bg-orange-200 text-black";
        }
    });
</script>

<div
    id="letterTile"
    class="aspect-square rounded-xl border-4 {bgColor()} flex flex-col items-center justify-center w-10 h-10 p-8"
>
    <h class="text-4xl font-bold">{tile.letter}</h>
    <span class="flex flex-row gap-1 items-center">
        <h class="text-md font-semibold">{tile.baseScore}</h>
        <p class="text-sm">x</p>
        <h class="text-md font-semibold">{tile.multiplier}</h>
    </span>
</div>
