<!--
    components/playerInfoPanel.svelte
-->

<script>
    export let player

    import { HAND_CONFIG } from "$lib/game/state.svelte";
</script>

<div
    class="border-4 px-8 py-2 rounded-xl flex flex-col items-center bg-green-400"
>
    <h1 class="font-bold text-xl">{player}</h1>

    <span class="flex gap-1">
        <h2 class="font-semibold">Letters:</h2>
        <h2 id="playerScoreText" class="font-bold">0 / {HAND_CONFIG.SIZE}</h2>
    </span>

    <span class="flex gap-1">
        <h2 class="font-semibold">Score:</h2>
        <h2 id="playerScoreText" class="font-bold">0</h2>
    </span>
</div>
