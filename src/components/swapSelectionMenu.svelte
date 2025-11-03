<!--
    components/swapSelectionMenu.svelte
    Modal that shows all available tiles in the bag for swap selection
-->

<script lang="ts">
    import type { TileData } from "$lib/game/types";
    import { sharedBag } from "$lib/game/sharedLetterBag.svelte";

    interface Props {
        onSelect: (tile: TileData, index: number) => void;
        onCancel: () => void;
    }

    let { onSelect, onCancel }: Props = $props();

    // Group tiles by letter and create a list with tile indices
    interface LetterGroup {
        letter: string;
        tiles: { tile: TileData; index: number }[];
    }

    const letterGroups = $derived(() => {
        const groups = new Map<string, { tile: TileData; index: number }[]>();

        sharedBag.forEach((tile, index) => {
            if (!groups.has(tile.letter)) {
                groups.set(tile.letter, []);
            }
            groups.get(tile.letter)!.push({ tile, index });
        });

        // Convert to array and sort alphabetically
        return Array.from(groups.entries())
            .map(([letter, tiles]) => ({ letter, tiles }))
            .sort((a, b) => a.letter.localeCompare(b.letter));
    });

    // Helper function to get multiplier color
    function getMultiplierColor(mult: number): string {
        if (mult <= 1) return "#ffffff";
        if (mult === 2) return "#b4e1ff";
        if (mult === 3) return "#7ef0a0";
        if (mult === 4) return "#f9f871";
        if (mult === 5) return "#ffb347";
        if (mult === 6) return "#ff7033";
        if (mult === 7) return "#ff3333";
        if (mult === 8) return "#a020f0";
        return "#ffffff"; // 9+
    }

    function getLetterGlow(mult: number): string {
        if (mult >= 9) {
            return "drop-shadow(0 0 8px rgba(255,255,255,0.9)) drop-shadow(0 0 4px rgba(255,255,255,0.6))";
        }
        if (mult >= 6) {
            return `drop-shadow(0 0 4px ${getMultiplierColor(mult).replace("#", "rgba(").replace(/(.{2})(.{2})(.{2})/, "$1,$2,$3,0.6)")})`;
        }
        return "none";
    }

    function handleTileClick(tile: TileData, index: number) {
        onSelect(tile, index);
    }

    function handleBackdropClick() {
        onCancel();
    }

    function handleEscape(e: KeyboardEvent) {
        if (e.key === "Escape") {
            onCancel();
        }
    }
</script>

<svelte:window onkeydown={handleEscape} />

<!-- Modal backdrop -->
<div
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    onclick={handleBackdropClick}
    onkeydown={(e) => e.key === 'Enter' && handleBackdropClick()}
    role="button"
    tabindex="-1"
    aria-label="Close swap menu"
>
    <!-- Modal content -->
    <div
        class="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden border-4 border-blue-400"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="swap-menu-title"
        aria-modal="true"
        tabindex="0"
    >
        <!-- Header -->
        <div
            class="sticky top-0 bg-blue-300 p-4 sm:p-6 flex items-center justify-between border-b-4 border-blue-400 shadow-lg"
        >
            <div>
                <h2 id="swap-menu-title" class="text-2xl sm:text-3xl font-bold text-blue-900">
                    🔁 Choose Your Swap Tile
                </h2>
                <p class="text-sm sm:text-base text-blue-800 mt-1">
                    Select a tile from the bag ({sharedBag.length} available)
                </p>
            </div>
            <button
                class="text-3xl sm:text-4xl hover:bg-blue-400 rounded-lg p-2 transition-colors font-bold text-blue-900"
                onclick={onCancel}
                aria-label="Close"
            >
                ✕
            </button>
        </div>

        <!-- Tile list -->
        <div class="overflow-y-auto" style="max-height: calc(80vh - 200px);">
            {#if sharedBag.length === 0}
                <div class="text-center py-12">
                    <p class="text-xl text-gray-600">No tiles available in the bag!</p>
                </div>
            {:else}
                <div class="p-4 sm:p-6 space-y-2 pb-4">
                    {#each letterGroups() as group}
                        <div class="bg-white/60 rounded-xl p-3 sm:p-4 border-2 border-blue-300 shadow-md">
                            <div class="flex items-center justify-between gap-4">
                                <!-- Letter display -->
                                <div class="flex items-center gap-3 sm:gap-4 flex-1">
                                    <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-orange-100 border-2 border-orange-300 flex items-center justify-center">
                                        <span class="text-3xl sm:text-4xl font-bold letter-stroke text-white">
                                            {group.letter}
                                        </span>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-sm sm:text-base text-gray-600 font-semibold">
                                            Letter: <span class="text-gray-900">{group.letter}</span>
                                        </span>
                                        <span class="text-sm sm:text-base text-gray-600 font-semibold">
                                            Available: <span class="text-blue-700">{group.tiles.length}</span>
                                        </span>
                                    </div>
                                </div>

                                <!-- Individual tile buttons -->
                                <div class="flex flex-wrap gap-1 sm:gap-2 justify-end">
                                    {#each group.tiles as { tile, index }}
                                        <button
                                            class="px-3 sm:px-4 py-2 rounded-lg border-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 border-blue-600 hover:border-blue-700 transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg text-white font-bold text-sm sm:text-base whitespace-nowrap"
                                            onclick={() => handleTileClick(tile, index)}
                                        >
                                            Take {tile.baseScore}×{tile.multiplier}
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Footer with cancel button -->
        <div class="sticky bottom-0 bg-blue-300 p-4 border-t-4 border-blue-400">
            <button
                class="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg"
                onclick={onCancel}
            >
                Cancel Swap
            </button>
        </div>
    </div>
</div>

<style>
    .letter-stroke {
        text-shadow:
            -1px -1px 0 #000,
            1px -1px 0 #000,
            -1px 1px 0 #000,
            1px 1px 0 #000;
    }
</style>
