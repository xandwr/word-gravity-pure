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
        const playerHandIsEmpty = gameState.playerHandSlots.every(
            (slot) => slot.heldLetterTile === null
        );
        if (playerHandIsEmpty) {
            const playerTiles = gameState.playerFreshHand();
            if (playerTiles) {
                playerTiles.forEach((tile, index) => {
                    gameState.setPlayerHandSlot(index, tile);
                });
            }
        }

        const opponentHandIsEmpty = gameState.opponentHandSlots.every(
            (slot) => slot.heldLetterTile === null
        );
        if (opponentHandIsEmpty) {
            const opponentTiles = gameState.opponentFreshHand();
            if (opponentTiles) {
                opponentTiles.forEach((tile, index) => {
                    gameState.setOpponentHandSlot(index, tile);
                });
            }
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
    let showResetConfirm = $state(false);

    // Derived state: should the swap box pulse when dragging?
    let shouldPulse = $derived.by(() => {
        const dragState = gameState.getDragState();
        const isDraggingFromHand = dragState.tile && dragState.sourceType === "hand";
        const swapAvailable = gameState.playerSwapsUsedThisTurn < 1 && gameState.playerSwapsRemaining > 0;
        return isDraggingFromHand && swapAvailable;
    });

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

    function handleResetButtonClick() {
        showResetConfirm = true;
    }

    function handleConfirmReset() {
        showResetConfirm = false;

        // Reset the game state
        gameState.resetGame();

        // Re-deal player hand
        const playerTiles = gameState.playerFreshHand();
        if (playerTiles) {
            playerTiles.forEach((tile, index) => {
                gameState.setPlayerHandSlot(index, tile);
            });
        }

        // Re-deal opponent hand
        const opponentTiles = gameState.opponentFreshHand();
        if (opponentTiles) {
            opponentTiles.forEach((tile, index) => {
                gameState.setOpponentHandSlot(index, tile);
            });
        }

        // Restart gravity system
        gameState.startGravity(300);
    }

    function handleCancelReset() {
        showResetConfirm = false;
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

        <div class="flex flex-col gap-1 sm:gap-2 h-full">
            <div
                id="swapButton"
                role="button"
                tabindex="0"
                class="flex-1 rounded-xl border-2 sm:border-4 flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 min-w-20 sm:min-w-[100px] transition-all duration-300 {isSwapHover
                    ? 'bg-blue-500 border-blue-700'
                    : 'bg-blue-200'} {gameState.playerSwapsRemaining <= 0 || gameState.playerSwapsUsedThisTurn >= 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'} {shouldPulse
                    ? 'animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.8)] border-blue-400'
                    : ''}"
                ondragover={handleSwapDragOver}
                ondragleave={handleSwapDragLeave}
                ondrop={handleSwapDrop}
                ontouchend={handleSwapTouchEnd}
            >
                <h1 class="text-xl sm:text-2xl md:text-4xl">🔁</h1>
                <h1 class="text-sm sm:text-base md:text-xl font-bold">Swap</h1>
                <span class="flex gap-0.5 sm:gap-1 text-xs sm:text-sm">
                    <h1 class="font-semibold">This turn:</h1>
                    <h1 class="font-bold">{gameState.playerSwapsUsedThisTurn >= 1 ? "0" : "1"}/1</h1>
                </span>
                <span class="flex gap-0.5 sm:gap-1 text-xs sm:text-sm">
                    <h1 class="font-semibold">Total:</h1>
                    <h1 class="font-bold">{gameState.playerSwapsRemaining}</h1>
                </span>
            </div>
            <button
                class="rounded-xl font-semibold border-2 sm:border-4 bg-red-200 hover:bg-red-300 hover:border-red-500 flex items-center justify-center cursor-pointer transition-all duration-300 text-sm"
                onclick={handleResetButtonClick}
                title="Reset Game"
            >
                Reset Game
            </button>
        </div>
    </div>

    <!-- Swap selection menu -->
    {#if showSwapMenu}
        <SwapSelectionMenu
            onSelect={handleSwapSelect}
            onCancel={handleSwapCancel}
        />
    {/if}

    <!-- Reset confirmation modal -->
    {#if showResetConfirm}
        <div
            class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            role="button"
            tabindex="0"
            onclick={handleCancelReset}
            onkeydown={(e) => e.key === 'Escape' && handleCancelReset()}
        >
            <div
                class="bg-linear-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-md border-2 border-purple-400/50 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-purple-500/20"
                role="dialog"
                tabindex="-1"
                aria-modal="true"
                aria-labelledby="reset-dialog-title"
                onclick={(e) => e.stopPropagation()}
                onkeydown={(e) => e.stopPropagation()}
            >
                <h2 id="reset-dialog-title" class="text-2xl font-bold text-white mb-4 text-center">Reset Game?</h2>
                <p class="text-purple-200 mb-8 text-center">
                    This will start a new game. All progress will be lost.
                </p>
                <div class="flex gap-4 justify-center">
                    <button
                        class="px-6 py-3 rounded-xl font-semibold bg-gray-700 hover:bg-gray-600 text-white border-2 border-gray-500 transition-all duration-300"
                        onclick={handleCancelReset}
                    >
                        Cancel
                    </button>
                    <button
                        class="px-6 py-3 rounded-xl font-semibold bg-red-600 hover:bg-red-500 text-white border-2 border-red-400 transition-all duration-300"
                        onclick={handleConfirmReset}
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>
