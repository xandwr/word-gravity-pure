<!-- 
    +layout.svelte
-->

<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import HeaderBar from "../components/headerBar.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main class="max-w-4xl m-auto border-x-4">
	<HeaderBar />
	{@render children()}
</main>
