<!--
    components/letterTile.svelte
-->

<script lang="ts">
    import type { TileData, TileHighlight } from "$lib/game/types";

    interface Props {
        tile: TileData;
        highlight?: TileHighlight;
        isClaimWave?: boolean; // If this tile is in the current claiming wave
        isDragging?: boolean; // If this tile is currently being dragged
    }

    let {
        tile,
        highlight = "none",
        isClaimWave = false,
        isDragging = false,
    }: Props = $props();

    // State for animated opacity
    let opacity = $state(1);

    // Effect to handle fade animation
    $effect(() => {
        if (!tile.fadingOut || !tile.fadeStartTime) {
            opacity = 1;
            return;
        }

        const FADE_DELAY = 400; // ms to wait before starting fade
        const FADE_DURATION = 300; // ms for fade animation

        // Animation loop to update opacity
        let animationFrameId: number;

        const updateOpacity = () => {
            const elapsed = Date.now() - tile.fadeStartTime!;

            if (elapsed < FADE_DELAY) {
                opacity = 1; // Stay visible during delay
                animationFrameId = requestAnimationFrame(updateOpacity);
            } else if (elapsed < FADE_DELAY + FADE_DURATION) {
                // Lerp from 1 to 0 during fade duration
                const fadeProgress = (elapsed - FADE_DELAY) / FADE_DURATION;
                opacity = 1 - fadeProgress;
                animationFrameId = requestAnimationFrame(updateOpacity);
            } else {
                opacity = 0; // Fade complete
            }
        };

        animationFrameId = requestAnimationFrame(updateOpacity);

        // Cleanup
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    });

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
            case "both-players":
                return "bg-pink-500 text-pink-950 border-pink-600";
            case "opponent-owned":
                return "bg-red-300 text-red-900 border-red-400";
            default:
                return "bg-orange-200 text-black border-orange-300";
        }
    });

    // Add pulsing animation during claiming wave or scale effect when dragging
    const animationClass = $derived(() => {
        if (isClaimWave) return "animate-pulse scale-110";
        if (isDragging) return "scale-110 opacity-75 shadow-2xl";
        return "";
    });

    // Multiplier color mapping
    const getMultiplierColor = (mult: number): string => {
        if (mult <= 1) return "#ffffff";
        if (mult === 2) return "#b4e1ff";
        if (mult === 3) return "#7ef0a0";
        if (mult === 4) return "#f9f871";
        if (mult === 5) return "#ffb347";
        if (mult === 6) return "#ff7033";
        if (mult === 7) return "#ff3333";
        if (mult === 8) return "#a020f0";
        return "#a020f0"; // 9+ base color (violet)
    };

    // Compute letter color and glow
    const letterColor = $derived(() => getMultiplierColor(tile.multiplier));

    // Add glow for high multipliers (6+)
    const letterGlow = $derived(() => {
        if (tile.multiplier >= 6 && tile.multiplier <= 8) {
            const color = getMultiplierColor(tile.multiplier);
            return `drop-shadow(0 0 4px ${color}) drop-shadow(0 0 8px ${color})`;
        }
        if (tile.multiplier >= 9) {
            // White glow overlay for transcendent (9+)
            return `drop-shadow(0 0 6px #ffffff) drop-shadow(0 0 12px #ffffff) drop-shadow(0 0 18px #a020f0)`;
        }
        return "none";
    });

    // Pulse animation for 10+ multipliers
    const shouldPulse = $derived(() => tile.multiplier >= 10);
</script>

<div
    id="letterTile"
    class="aspect-square rounded-xl border-2 sm:border-4 {bgColor()} {animationClass()} flex flex-col items-center justify-center w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 p-1 sm:p-2 md:p-4 transition-transform duration-150"
    style="opacity: {opacity};"
>
    <h
        class="text-xl sm:text-2xl md:text-4xl font-bold letter-stroke {shouldPulse()
            ? 'mult-pulse'
            : ''}"
        style="color: {letterColor()}; filter: {letterGlow()};"
    >
        {tile.letter}
    </h>
    <span
        class="flex flex-row gap-0.5 sm:gap-1 items-center text-xs sm:text-sm md:text-md"
    >
        <h class="font-semibold">{tile.baseScore}</h>
        <p>x</p>
        <h class="font-semibold">{tile.multiplier}</h>
    </span>
</div>

<style>
    .letter-stroke {
        -webkit-text-stroke: 4px black;
        stroke: 4px black;
        paint-order: stroke fill;
    }

    @keyframes multPulse {
        0%,
        100% {
            color: #a020f0;
            filter: drop-shadow(0 0 6px #ffffff) drop-shadow(0 0 12px #ffffff)
                drop-shadow(0 0 18px #a020f0);
        }
        50% {
            color: #ffffff;
            filter: drop-shadow(0 0 8px #ffffff) drop-shadow(0 0 16px #ffffff)
                drop-shadow(0 0 24px #a020f0);
        }
    }

    .mult-pulse {
        animation: multPulse 2s ease-in-out infinite;
    }
</style>
