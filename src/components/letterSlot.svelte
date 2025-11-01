<!--
    components/letterSlot.svelte
-->

<script lang="ts">
    import LetterTile from "./letterTile.svelte";
    import type { TileData, TileHighlight } from "$lib/game/types";
    import { gameState } from "$lib/game/state.svelte";

    interface Props {
        index: number;
        tile?: TileData | null;
        slotType: "hand" | "board";
    }

    let { index, tile = null, slotType }: Props = $props();

    // Get highlight for board tiles - needs to be reactive
    const highlight = $derived<TileHighlight>(
        slotType === "board" && tile
            ? gameState.validator.getHighlight(index)
            : "none"
    );

    let isDragOver = $state(false);

    // Block interaction when board is settling
    const canInteract = $derived(gameState.boardSettled);

    function handleDragStart(e: DragEvent) {
        if (!tile || !canInteract) return;

        gameState.startDrag(tile, slotType, index);

        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", tile.id);
        }
    }

    function handleTouchStart(e: TouchEvent) {
        if (!tile || !canInteract) return;
        gameState.startDrag(tile, slotType, index);
    }

    function handleDragOver(e: DragEvent) {
        if (!canInteract) return;
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = "move";
        }
        isDragOver = true;
    }

    function handleDragLeave() {
        isDragOver = false;
    }

    function handleDrop(e: DragEvent) {
        if (!canInteract) return;
        e.preventDefault();
        isDragOver = false;

        const dragState = gameState.getDragState();
        if (
            !dragState.tile ||
            dragState.sourceIndex === null ||
            dragState.sourceType === null
        ) {
            return;
        }

        // Only allow drops to empty board slots from hand
        if (slotType === "board" && !tile && dragState.sourceType === "hand") {
            const success = gameState.moveFromHandToBoard(
                dragState.sourceIndex,
                index,
            );
            if (success) {
                // End player turn after placing a tile
                gameState.endPlayerTurn();
            }
        }
        // Allow moving back from board to empty hand slot
        else if (
            slotType === "hand" &&
            !tile &&
            dragState.sourceType === "board"
        ) {
            gameState.moveFromBoardToHand(dragState.sourceIndex, index);
        }

        gameState.endDrag();
    }

    function handleDragEnd() {
        isDragOver = false;
        gameState.endDrag();
    }

    function handleTouchEnd(e: TouchEvent) {
        const dragState = gameState.getDragState();

        if (!tile) {
            if (
                !dragState.tile ||
                dragState.sourceIndex === null ||
                dragState.sourceType === null
            ) {
                gameState.endDrag();
                return;
            }

            // Check if touch ended over this slot
            const touch = e.changedTouches[0];
            const element = document.elementFromPoint(
                touch.clientX,
                touch.clientY,
            );

            // Check for swap button first
            const swapButton = element?.closest("#swapButton");
            if (swapButton && dragState.sourceType === "hand") {
                if (gameState.playerSwapsRemaining > 0) {
                    gameState.swapPlayerTile(dragState.sourceIndex);
                }
                gameState.endDrag();
                return;
            }

            const slotElement = element?.closest("[data-slot-index]");

            if (slotElement) {
                const targetIndex = parseInt(
                    slotElement.getAttribute("data-slot-index") || "-1",
                );
                const targetType = slotElement.getAttribute(
                    "data-slot-type",
                ) as "hand" | "board";

                if (
                    targetType === "board" &&
                    dragState.sourceType === "hand" &&
                    targetIndex >= 0
                ) {
                    const success = gameState.moveFromHandToBoard(
                        dragState.sourceIndex,
                        targetIndex,
                    );
                    if (success) {
                        // End player turn after placing a tile
                        gameState.endPlayerTurn();
                    }
                } else if (
                    targetType === "hand" &&
                    dragState.sourceType === "board" &&
                    targetIndex >= 0
                ) {
                    gameState.moveFromBoardToHand(
                        dragState.sourceIndex,
                        targetIndex,
                    );
                }
            }
        }

        gameState.endDrag();
    }
</script>

<div
    id="letterSlot"
    class="aspect-square rounded-xl border-4 flex flex-col items-center justify-center w-10 h-10 p-8 shadow-md {isDragOver
        ? 'bg-blue-300 border-blue-500'
        : 'bg-black/20'}"
    data-slot-index={index}
    data-slot-type={slotType}
    role="button"
    tabindex="0"
    draggable={tile !== null && canInteract}
    ondragstart={handleDragStart}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    ondragend={handleDragEnd}
    ontouchstart={handleTouchStart}
    ontouchend={handleTouchEnd}
>
    {#if tile}
        <LetterTile {tile} {highlight} />
    {/if}
</div>
