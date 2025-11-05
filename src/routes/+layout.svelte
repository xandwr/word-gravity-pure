<!--
    +layout.svelte
-->

<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import HeaderBar from "../components/headerBar.svelte";
	import SwapIndicatorLines from "../components/swapIndicatorLines.svelte";
	import { onMount } from "svelte";
	import { initializeShaderBackground } from "$lib/shaders/backgroundShader.svelte";

	let { children } = $props();

	// Initialize global shader background
        onMount(() => {
                let disposed = false;
                let cleanup: (() => void) | null = null;

                initializeShaderBackground("globalBackgroundCanvas")
                        .then((result) => {
                                if (!result) {
                                        return;
                                }

                                if (disposed) {
                                        result();
                                        return;
                                }

                                cleanup = result;
                        })
                        .catch((error) => {
                                console.error("Failed to initialize shader background", error);
                        });

                // Return cleanup function
                return () => {
                        disposed = true;

                        if (cleanup) {
                                cleanup();
                                cleanup = null;
                        }
                };
        });
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<style>
		/* Prevent Font Awesome icon flash on load */
		svg:not(:root).svg-inline--fa {
			overflow: visible;
			box-sizing: content-box;
		}
		.svg-inline--fa {
			display: var(--fa-display, inline-block);
			height: 1em;
			overflow: visible;
			vertical-align: -0.125em;
		}
	</style>
</svelte:head>

<!-- Global background canvas -->
<canvas id="globalBackgroundCanvas" class="fixed inset-0 -z-50 w-full h-full"
></canvas>

<!-- Swap indicator lines overlay -->
<SwapIndicatorLines />

<main class="max-w-4xl m-auto sm:border-x-4 border-blue-800/40">
	<HeaderBar />
	{@render children()}
</main>
