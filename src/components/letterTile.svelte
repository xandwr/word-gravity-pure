<!--
    components/letterTile.svelte
-->

<script lang="ts">
    import type { TileData, TileHighlight } from "$lib/game/types";

    interface Props {
        tile: TileData;
        highlight?: TileHighlight;
        isClaimWave?: boolean; // If this tile is in the current claiming wave
    }

    let { tile, highlight = "none", isClaimWave = false }: Props = $props();

    // Determine background color based on claim status and highlight
    const bgColor = $derived(() => {
        // Fading out tiles
        if (tile.fadingOut) {
            return "bg-green-400 text-green-950 border-green-600";
        }

        // Claimed tiles get a distinct locked appearance
        if (tile.claimedBy === "player") {
            return "bg-green-400 text-green-950 border-green-600";
        } else if (tile.claimedBy === "opponent") {
            return "bg-gray-400 text-gray-950 border-gray-600";
        }

        // Unclaimed tiles show highlight colors
        switch (highlight) {
            case "horizontal":
                return "bg-blue-300 text-blue-900 border-blue-400";
            case "vertical":
                return "bg-orange-300 text-orange-900 border-orange-400";
            case "intersection":
                return "bg-purple-300 text-purple-900 border-purple-400";
            case "opponent-owned":
                return "bg-red-300 text-red-900 border-red-400";
            default:
                return "bg-orange-200 text-black border-orange-300";
        }
    });

    // Add pulsing animation during claiming wave
    const animationClass = $derived(isClaimWave ? "animate-pulse scale-110" : "");

    // Calculate opacity based on fade state
    const opacity = $derived(() => {
        if (!tile.fadingOut) return 1;
        return 0; // Fade to 0 when fadingOut is true
    });
</script>

<div
    id="letterTile"
    class="aspect-square rounded-xl border-4 {bgColor()} {animationClass} flex flex-col items-center justify-center w-10 h-10 p-8 transition-all duration-300"
    style="opacity: {opacity()};"
>
    <h class="text-4xl font-bold">{tile.letter}</h>
    <span class="flex flex-row gap-1 items-center">
        <h class="text-md font-semibold">{tile.baseScore}</h>
        <p class="text-sm">x</p>
        <h class="text-md font-semibold">{tile.multiplier}</h>
    </span>
</div>
