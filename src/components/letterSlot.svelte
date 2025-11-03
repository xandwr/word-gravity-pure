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

    // Track touch state to differentiate between tap and drag
    let touchStartPos: { x: number; y: number } | null = null;
    let hasMoved = false;
    const MOVE_THRESHOLD = 10; // pixels - movement beyond this is considered a drag

    // Mobile drag preview state
    let dragPreview: {
        element: HTMLDivElement | null;
        x: number;
        y: number;
    } = $state({
        element: null,
        x: 0,
        y: 0,
    });

    // Block interaction when board is settling or claiming is in progress
    const canInteract = $derived(
        gameState.boardSettled && !gameState.isClaimingActive,
    );

    // Helper function to create mobile drag preview
    function createDragPreview(touch: Touch) {
        if (!tile || dragPreview.element) return;

        const preview = document.createElement("div");
        preview.id = "mobile-drag-preview";
        preview.style.position = "fixed";
        preview.style.pointerEvents = "none";
        preview.style.zIndex = "9999";
        preview.style.transform = "translate(-50%, -50%)";
        preview.style.transition = "none";

        // Create the tile preview using the same component structure
        preview.innerHTML = `
            <div class="aspect-square rounded-xl border-2 sm:border-4 bg-orange-200 text-black border-orange-300 flex flex-col items-center justify-center w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 p-1 sm:p-2 md:p-4 scale-110 opacity-90 shadow-2xl">
                <h class="text-xl sm:text-2xl md:text-4xl font-bold letter-stroke" style="color: ${getMultiplierColor(tile.multiplier)}; filter: ${getLetterGlow(tile.multiplier)};">
                    ${tile.letter}
                </h>
                <span class="flex flex-row gap-0.5 sm:gap-1 items-center text-xs sm:text-sm md:text-md">
                    <h class="font-semibold">${tile.baseScore}</h>
                    <p>x</p>
                    <h class="font-semibold">${tile.multiplier}</h>
                </span>
            </div>
        `;

        document.body.appendChild(preview);
        dragPreview.element = preview;
        updateDragPreviewPosition(touch.clientX, touch.clientY);
    }

    // Helper function to update preview position
    function updateDragPreviewPosition(x: number, y: number) {
        if (dragPreview.element) {
            dragPreview.element.style.left = `${x}px`;
            dragPreview.element.style.top = `${y}px`;
        }
    }

    // Helper function to destroy drag preview
    function destroyDragPreview() {
        if (dragPreview.element) {
            dragPreview.element.remove();
            dragPreview.element = null;
        }
    }

    // Helper function to get multiplier color (matching letterTile.svelte)
    function getMultiplierColor(mult: number): string {
        if (mult <= 1) return "#ffffff";
        if (mult === 2) return "#b4e1ff";
        if (mult === 3) return "#7ef0a0";
        if (mult === 4) return "#f9f871";
        if (mult === 5) return "#ffb347";
        if (mult === 6) return "#ff7033";
        if (mult === 7) return "#ff3333";
        if (mult === 8) return "#a020f0";
        return "#a020f0"; // 9+ base color (violet)
    }

    // Helper function to get letter glow (matching letterTile.svelte)
    function getLetterGlow(mult: number): string {
        if (mult >= 6 && mult <= 8) {
            const color = getMultiplierColor(mult);
            return `drop-shadow(0 0 4px ${color}) drop-shadow(0 0 8px ${color})`;
        }
        if (mult >= 9) {
            return `drop-shadow(0 0 6px #ffffff) drop-shadow(0 0 12px #ffffff) drop-shadow(0 0 18px #a020f0)`;
        }
        return "none";
    }

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

        // Store initial touch position
        const touch = e.touches[0];
        touchStartPos = { x: touch.clientX, y: touch.clientY };
        hasMoved = false;

        // Add global touchmove and touchend listeners
        const handleGlobalTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0];

            // Check if movement exceeds threshold
            if (touchStartPos && !hasMoved) {
                const deltaX = Math.abs(touch.clientX - touchStartPos.x);
                const deltaY = Math.abs(touch.clientY - touchStartPos.y);

                if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
                    // This is a drag, not a tap
                    hasMoved = true;
                    e.preventDefault(); // Prevent scrolling while dragging
                    gameState.startDrag(tile!, slotType, index);
                    // Create mobile drag preview
                    createDragPreview(touch);
                    console.log("Drag started after movement detected");
                }
            }

            // Only process drag events if we've confirmed this is a drag
            if (hasMoved) {
                e.preventDefault();
                // Update preview position
                updateDragPreviewPosition(touch.clientX, touch.clientY);

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
            }
        };

        const handleGlobalTouchEnd = (e: TouchEvent) => {
            console.log("Global touch end", { hasMoved });

            // If no movement occurred, this is a tap - trigger click handler
            if (!hasMoved) {
                console.log("Tap detected, triggering claim");
                touchStartPos = null;
                destroyDragPreview(); // Clean up preview if any
                document.removeEventListener(
                    "touchmove",
                    handleGlobalTouchMove,
                );
                document.removeEventListener("touchend", handleGlobalTouchEnd);

                // Handle claiming on board tiles
                if (slotType === "board" && tile && canInteract) {
                    gameState.claimTilesFrom(index);
                }
                return;
            }

            // Get current drag state
            const currentDragState = gameState.getDragState();
            if (!currentDragState.tile) {
                touchStartPos = null;
                hasMoved = false;
                destroyDragPreview(); // Clean up preview
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

            // Check for swap button first - let the swap button handle the logic
            const swapButton = element?.closest("#swapButton");
            if (swapButton && currentDragState.sourceType === "hand") {
                // Trigger the swap button's touch end handler
                if (swapButton instanceof HTMLElement) {
                    swapButton.dispatchEvent(new TouchEvent("touchend", {
                        changedTouches: [touch],
                        bubbles: true,
                        cancelable: true
                    }));
                }
                touchStartPos = null;
                hasMoved = false;
                destroyDragPreview(); // Clean up preview
                // Don't end drag yet - let the swap button handler do it
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

            touchStartPos = null;
            hasMoved = false;
            destroyDragPreview(); // Clean up preview
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
    class="aspect-square rounded-xl border-2 sm:border-4 flex flex-col items-center justify-center w-12.5 h-12.5 sm:w-16 sm:h-16 md:w-20 md:h-20 p-1 sm:p-2 md:p-4 shadow-md {isDragOver
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

<style>
    :global(#mobile-drag-preview .letter-stroke) {
        -webkit-text-stroke: 4px black;
        stroke: 4px black;
        paint-order: stroke fill;
    }
</style>
