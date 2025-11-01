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
    // Always show highlights from the player's perspective
    const highlight = $derived<TileHighlight>(
        slotType === "board" && tile
            ? gameState.validator.getHighlight(index, "player", gameState.board)
            : "none",
    );

    let isDragOver = $state(false);

    // Block interaction when board is settling or claiming is in progress
    const canInteract = $derived(
        gameState.boardSettled && !gameState.isClaimingActive,
    );

    // Check if this tile is in the current claiming wave
    const isInClaimWave = $derived(() => {
        if (!gameState.isClaimingActive || slotType !== "board") return false;
        const currentWave = gameState.currentClaimingWaves[0];
        return currentWave?.includes(index) ?? false;
    });

    // Check if this tile is currently being dragged
    const isDragging = $derived(() => {
        const dragState = gameState.getDragState();
        return (
            dragState.tile?.id === tile?.id &&
            dragState.sourceIndex === index &&
            dragState.sourceType === slotType
        );
    });

    function handleDragStart(e: DragEvent) {
        if (!tile || !canInteract) return;

        gameState.startDrag(tile, slotType, index);

        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", tile.id);
        }
    }

    function handleTouchStart(e: TouchEvent) {
        console.log("Touch start:", {
            tile: tile?.letter,
            slotType,
            index,
            canInteract,
        });
        if (!tile || !canInteract) {
            console.log(
                "Touch start blocked:",
                !tile ? "no tile" : "can't interact",
            );
            return;
        }
        e.preventDefault(); // Prevent scrolling while dragging
        gameState.startDrag(tile, slotType, index);
        console.log("Drag started, added global listeners");

        // Add global touchmove and touchend listeners
        const handleGlobalTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const touch = e.touches[0];
            const element = document.elementFromPoint(
                touch.clientX,
                touch.clientY,
            );
            const slotElement = element?.closest("[data-slot-index]");

            // Update isDragOver for this slot
            if (slotElement) {
                const hoveredIndex = parseInt(
                    slotElement.getAttribute("data-slot-index") || "-1",
                );
                isDragOver = hoveredIndex === index && !tile;
            } else {
                isDragOver = false;
            }
        };

        const handleGlobalTouchEnd = (e: TouchEvent) => {
            console.log("Global touch end");

            // Get current drag state
            const currentDragState = gameState.getDragState();
            if (!currentDragState.tile) {
                gameState.endDrag();
                document.removeEventListener(
                    "touchmove",
                    handleGlobalTouchMove,
                );
                document.removeEventListener("touchend", handleGlobalTouchEnd);
                return;
            }

            // Process the drop at the touch position
            const touch = e.changedTouches[0];
            const element = document.elementFromPoint(
                touch.clientX,
                touch.clientY,
            );

            // Check for swap button first
            const swapButton = element?.closest("#swapButton");
            if (swapButton && currentDragState.sourceType === "hand") {
                if (gameState.playerSwapsRemaining > 0) {
                    gameState.swapPlayerTile(currentDragState.sourceIndex ?? 0);
                }
                gameState.endDrag();
                document.removeEventListener(
                    "touchmove",
                    handleGlobalTouchMove,
                );
                document.removeEventListener("touchend", handleGlobalTouchEnd);
                return;
            }

            const slotElement = element?.closest("[data-slot-index]");
            console.log("Slot element found:", slotElement);

            if (slotElement) {
                const targetIndex = parseInt(
                    slotElement.getAttribute("data-slot-index") || "-1",
                );
                const targetType = slotElement.getAttribute(
                    "data-slot-type",
                ) as "hand" | "board";

                console.log("Drop target:", {
                    targetIndex,
                    targetType,
                    sourceType: currentDragState.sourceType,
                    sourceIndex: currentDragState.sourceIndex,
                });

                if (
                    targetType === "board" &&
                    currentDragState.sourceType === "hand" &&
                    targetIndex >= 0
                ) {
                    console.log("Attempting move from hand to board");
                    const boardSlot = gameState.board[targetIndex];
                    // Only allow drop on empty slots
                    if (!boardSlot.heldLetterTile) {
                        const success = gameState.moveFromHandToBoard(
                            currentDragState.sourceIndex ?? 0,
                            targetIndex,
                        );
                        console.log("Move success:", success);
                        if (success) {
                            gameState.endPlayerTurn();
                        }
                    }
                } else if (
                    targetType === "hand" &&
                    currentDragState.sourceType === "board" &&
                    targetIndex >= 0
                ) {
                    console.log("Attempting move from board to hand");
                    const handSlot = gameState.playerHandSlots[targetIndex];
                    // Only allow drop on empty slots
                    if (!handSlot.heldLetterTile) {
                        gameState.moveFromBoardToHand(
                            currentDragState.sourceIndex ?? 0,
                            targetIndex,
                        );
                    }
                }
            }

            gameState.endDrag();
            document.removeEventListener("touchmove", handleGlobalTouchMove);
            document.removeEventListener("touchend", handleGlobalTouchEnd);
        };

        document.addEventListener("touchmove", handleGlobalTouchMove, {
            passive: false,
        });
        document.addEventListener("touchend", handleGlobalTouchEnd, {
            passive: false,
        });
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

    function handleClick() {
        // Handle claiming on board tiles during player's turn
        if (slotType === "board" && tile && canInteract) {
            gameState.claimTilesFrom(index);
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        // Handle keyboard activation (Enter or Space) for claiming
        if (
            (e.key === "Enter" || e.key === " ") &&
            slotType === "board" &&
            tile &&
            canInteract
        ) {
            e.preventDefault(); // Prevent scrolling on Space
            gameState.claimTilesFrom(index);
        }
    }

    function handleTouchEnd(e: TouchEvent) {
        const dragState = gameState.getDragState();
        console.log("handleTouchEnd called", { hasTile: !!tile, dragState });

        if (!tile) {
            if (
                !dragState.tile ||
                dragState.sourceIndex === null ||
                dragState.sourceType === null
            ) {
                console.log("No drag state, ending");
                gameState.endDrag();
                return;
            }

            // Check if touch ended over this slot
            const touch = e.changedTouches[0];
            console.log("Touch position:", touch.clientX, touch.clientY);
            const element = document.elementFromPoint(
                touch.clientX,
                touch.clientY,
            );
            console.log("Element at touch:", element);

            // Check for swap button first
            const swapButton = element?.closest("#swapButton");
            if (swapButton && dragState.sourceType === "hand") {
                console.log("Found swap button");
                if (gameState.playerSwapsRemaining > 0) {
                    gameState.swapPlayerTile(dragState.sourceIndex);
                }
                gameState.endDrag();
                return;
            }

            const slotElement = element?.closest("[data-slot-index]");
            console.log("Slot element found:", slotElement);

            if (slotElement) {
                const targetIndex = parseInt(
                    slotElement.getAttribute("data-slot-index") || "-1",
                );
                const targetType = slotElement.getAttribute(
                    "data-slot-type",
                ) as "hand" | "board";

                console.log("Drop target:", {
                    targetIndex,
                    targetType,
                    sourceType: dragState.sourceType,
                    sourceIndex: dragState.sourceIndex,
                });

                if (
                    targetType === "board" &&
                    dragState.sourceType === "hand" &&
                    targetIndex >= 0
                ) {
                    console.log("Attempting move from hand to board");
                    const success = gameState.moveFromHandToBoard(
                        dragState.sourceIndex,
                        targetIndex,
                    );
                    console.log("Move success:", success);
                    if (success) {
                        // End player turn after placing a tile
                        gameState.endPlayerTurn();
                    }
                } else if (
                    targetType === "hand" &&
                    dragState.sourceType === "board" &&
                    targetIndex >= 0
                ) {
                    console.log("Attempting move from board to hand");
                    gameState.moveFromBoardToHand(
                        dragState.sourceIndex,
                        targetIndex,
                    );
                }
            } else {
                console.log("No slot element found at touch position");
            }
        } else {
            console.log("This slot has a tile, not processing drop");
        }

        gameState.endDrag();
    }

    // Svelte action to add touch event listeners with passive: false
    function touchHandlers(node: HTMLElement) {
        node.addEventListener("touchstart", handleTouchStart, {
            passive: false,
        });

        return {
            destroy() {
                node.removeEventListener("touchstart", handleTouchStart);
            },
        };
    }
</script>

<div
    id="letterSlot"
    class="aspect-square rounded-xl border-2 sm:border-4 flex flex-col items-center justify-center w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 p-1 sm:p-2 md:p-4 shadow-md {isDragOver
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
    use:touchHandlers
    onclick={handleClick}
    onkeydown={handleKeyDown}
>
    {#if tile}
        <LetterTile
            {tile}
            {highlight}
            isClaimWave={isInClaimWave()}
            isDragging={isDragging()}
        />
    {/if}
</div>
