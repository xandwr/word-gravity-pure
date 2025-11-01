<!-- 
    +page.svelte
-->

<script>
    import WordGrid from "../components/wordGrid.svelte";
    import PlayerHand from "../components/playerHand.svelte";
    import { gameState, HAND_CONFIG } from "$lib/game/state.svelte";
    import PlayerInfoPanel from "../components/playerInfoPanel.svelte";
</script>

<main class="flex flex-col justify-between">
    <header
        class="flex flex-col items-center bg-blue-800 text-white p-3 border-b-4 border-blue-950 shadow-lg"
    >
        <h1 class="font-bold text-4xl">Word Gravity</h1>
    </header>

    <div class="flex flex-col">
        <div class="bg-red-500/20 w-full h-full p-4 flex justify-center">
            <WordGrid />
        </div>

        <div class="flex items-center gap-1 text-xl justify-center bg-blue-200 p-2">
            <h1 class="">Current Turn:</h1>
            <h1 class="font-bold uppercase">{gameState.currentPlayerTurn}</h1>
        </div>

        <div class="flex justify-center bg-orange-500/50">
            <div class="flex justify-between w-sm">
                <PlayerInfoPanel player="player" />
                <PlayerInfoPanel player="opponent" />
            </div>
        </div>

        <div class="bg-purple-500/20 w-full h-full p-4 flex justify-center">
            <PlayerHand />
        </div>
    </div>
</main>
