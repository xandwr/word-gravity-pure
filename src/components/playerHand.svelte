<!--
    components/playerHand.svelte
-->

<script lang="ts">
    import { onMount } from "svelte";
    import LetterSlot from "./letterSlot.svelte";
    import SwapSelectionMenu from "./swapSelectionMenu.svelte";
    import { gameState, HAND_CONFIG } from "$lib/game/state.svelte";
    import type { TileData } from "$lib/game/types";

    // Populate both player and opponent hands when the component mounts
    onMount(() => {
        // Deal player hand
        const playerTiles = gameState.playerFreshHand();
        if (playerTiles) {
            playerTiles.forEach((tile, index) => {
                gameState.setPlayerHandSlot(index, tile);
            });
        }

        // Deal opponent hand
        const opponentTiles = gameState.opponentFreshHand();
        if (opponentTiles) {
            opponentTiles.forEach((tile, index) => {
                gameState.setOpponentHandSlot(index, tile);
            });
        }

        // Start gravity system (300ms tick interval)
        gameState.startGravity(300);

        // Cleanup function to stop gravity when component unmounts
        return () => {
            gameState.stopGravity();
        };
    });

    let isSwapHover = $state(false);
    let showSwapMenu = $state(false);
    let swapHandIndex = $state<number | null>(null);

    function handleSwapDragOver(e: DragEvent) {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = "move";
        }
        isSwapHover = true;
    }

    function handleSwapDragLeave() {
        isSwapHover = false;
    }

    function handleSwapDrop(e: DragEvent) {
        e.preventDefault();
        isSwapHover = false;

        const dragState = gameState.getDragState();
        if (
            !dragState.tile ||
            dragState.sourceIndex === null ||
            dragState.sourceType !== "hand"
        ) {
            return;
        }

        // Only allow swapping tiles from hand
        if (gameState.playerSwapsRemaining > 0) {
            // Store the hand index and show the selection menu
            swapHandIndex = dragState.sourceIndex;
            showSwapMenu = true;
        }

        gameState.endDrag();
    }

    function handleSwapTouchEnd(e: TouchEvent) {
        const dragState = gameState.getDragState();
        if (
            !dragState.tile ||
            dragState.sourceIndex === null ||
            dragState.sourceType !== "hand"
        ) {
            return;
        }

        // Check if touch ended over the swap button
        const touch = e.changedTouches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const swapButton = element?.closest("#swapButton");

        if (swapButton && gameState.playerSwapsRemaining > 0) {
            // Store the hand index and show the selection menu
            swapHandIndex = dragState.sourceIndex;
            showSwapMenu = true;
            // End the drag state since we're showing the menu
            gameState.endDrag();
        }
    }

    function handleSwapSelect(tile: TileData, bagIndex: number) {
        if (swapHandIndex !== null) {
            gameState.swapPlayerTileWithSpecific(swapHandIndex, bagIndex);
        }
        showSwapMenu = false;
        swapHandIndex = null;
    }

    function handleSwapCancel() {
        showSwapMenu = false;
        swapHandIndex = null;
    }
</script>

<div>
    <div class="flex flex-row gap-1 sm:gap-2 items-center justify-center">
        <div id="handSlots" class="grid grid-cols-4 grid-rows-2 gap-1.5">
            {#each gameState.playerHandSlots as slot, index}
                <LetterSlot
                    {index}
                    tile={slot.heldLetterTile}
                    slotType="hand"
                />
            {/each}
        </div>

        <div class="flex items-stretch justify-center h-full">
            <div
                id="swapButton"
                role="button"
                tabindex="0"
                class="h-full rounded-xl border-2 sm:border-4 flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 min-w-20 sm:min-w-[100px] {isSwapHover
                    ? 'bg-blue-500 border-blue-700'
                    : 'bg-blue-200'} {gameState.playerSwapsRemaining <= 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'}"
                ondragover={handleSwapDragOver}
                ondragleave={handleSwapDragLeave}
                ondrop={handleSwapDrop}
                ontouchend={handleSwapTouchEnd}
            >
                <h1 class="text-xl sm:text-2xl md:text-4xl">🔁</h1>
                <h1 class="text-sm sm:text-base md:text-xl font-bold">Swap</h1>
                <span class="flex gap-0.5 sm:gap-1 text-xs sm:text-sm">
                    <h1 class="font-semibold">Remaining:</h1>
                    <h1 class="font-bold">{gameState.playerSwapsRemaining}</h1>
                </span>
            </div>
        </div>
    </div>

    <!-- Swap selection menu -->
    {#if showSwapMenu}
        <SwapSelectionMenu
            onSelect={handleSwapSelect}
            onCancel={handleSwapCancel}
        />
    {/if}
</div>
