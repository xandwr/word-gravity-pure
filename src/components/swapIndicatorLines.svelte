<script lang="ts">
    import { onMount } from "svelte";
    import { gameState } from "$lib/game/state.svelte";

    const BOARD_COLS = 7;
    const BOARD_ROWS = 6;

    // State for drag preview position
    let dragPreviewX = $state(0);
    let dragPreviewY = $state(0);
    let lines = $state<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);
    let swapBoxLine = $state<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

    // Update lines when drag state or preview position changes
    $effect(() => {
        const dragState = gameState.getDragState();
        const isDragging = dragState.tile !== null && dragState.sourceType === "hand";
        const hasSwaps = gameState.playerSwapsRemaining > 0 && gameState.playerSwapsUsedThisTurn < 1;

        if (isDragging && hasSwaps && (dragPreviewX !== 0 || dragPreviewY !== 0)) {
            updateLines();
            updateSwapBoxLine();
        } else {
            lines = [];
            swapBoxLine = null;
        }
    });

    function updateLines() {
        const newLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

        // Get all board tiles
        for (let i = 0; i < BOARD_COLS * BOARD_ROWS; i++) {
            const slot = gameState.getBoardTile(i);
            if (slot) {
                // Get the board slot element
                const slotElement = document.querySelector(`[data-slot-index="${i}"][data-slot-type="board"]`) as HTMLElement;
                if (slotElement) {
                    const rect = slotElement.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;

                    newLines.push({
                        x1: centerX,
                        y1: centerY,
                        x2: dragPreviewX,
                        y2: dragPreviewY
                    });
                }
            }
        }

        lines = newLines;
    }

    function updateSwapBoxLine() {
        const swapButton = document.getElementById("swapButton");
        if (swapButton) {
            const rect = swapButton.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            swapBoxLine = {
                x1: centerX,
                y1: centerY,
                x2: dragPreviewX,
                y2: dragPreviewY
            };
        } else {
            swapBoxLine = null;
        }
    }

    // Listen for global drag events to update preview position
    onMount(() => {
        // Desktop drag tracking
        const handleDragOver = (e: DragEvent) => {
            dragPreviewX = e.clientX;
            dragPreviewY = e.clientY;
        };

        // Mobile touch tracking
        const handleTouchMove = (e: TouchEvent) => {
            // Check if we're in a drag operation
            const dragState = gameState.getDragState();
            if (dragState.tile && dragState.sourceType === "hand") {
                const touch = e.touches[0];
                if (touch) {
                    dragPreviewX = touch.clientX;
                    dragPreviewY = touch.clientY;
                }
            }
        };

        // Reset on drag end
        const handleDragEnd = () => {
            dragPreviewX = 0;
            dragPreviewY = 0;
            lines = [];
            swapBoxLine = null;
        };

        const handleTouchEnd = () => {
            dragPreviewX = 0;
            dragPreviewY = 0;
            lines = [];
            swapBoxLine = null;
        };

        document.addEventListener("dragover", handleDragOver);
        document.addEventListener("dragend", handleDragEnd);
        document.addEventListener("touchmove", handleTouchMove, { passive: true });
        document.addEventListener("touchend", handleTouchEnd);

        return () => {
            document.removeEventListener("dragover", handleDragOver);
            document.removeEventListener("dragend", handleDragEnd);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    });
</script>

<svg class="fixed inset-0 pointer-events-none z-30 w-full h-full">
    <!-- Lines from board tiles to drag preview -->
    {#each lines as line}
        <line
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="rgba(255, 255, 255, 0.15)"
            stroke-width="1"
            stroke-dasharray="4 4"
        />
    {/each}

    <!-- Line from swap box to drag preview -->
    {#if swapBoxLine}
        <line
            x1={swapBoxLine.x1}
            y1={swapBoxLine.y1}
            x2={swapBoxLine.x2}
            y2={swapBoxLine.y2}
            stroke="rgba(59, 130, 246, 0.4)"
            stroke-width="2"
            stroke-dasharray="6 3"
        />
    {/if}
</svg>
