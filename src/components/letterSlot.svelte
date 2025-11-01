<!--
    components/letterSlot.svelte
-->

<script lang="ts">
    import LetterTile from "./letterTile.svelte";
    import type { TileData } from "$lib/game/types";

    interface Props {
        index: number;
        tile?: TileData | null;
    }

    let { index, tile = null }: Props = $props();
</script>

<div
    id="letterSlot"
    class="aspect-square rounded-xl border-4 bg-black/20 flex flex-col items-center justify-center w-10 h-10 p-8 shadow-md"
>
    {#if tile}
        <LetterTile {tile} />
    {/if}
</div>
