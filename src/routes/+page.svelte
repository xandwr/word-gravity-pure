<!-- 
    +page.svelte
-->

<script>
    import WordGrid from "../components/wordGrid.svelte";
    import PlayerHand from "../components/playerHand.svelte";
    import { gameState, HAND_CONFIG } from "$lib/game/state.svelte";
    import PlayerInfoPanel from "../components/playerInfoPanel.svelte";
</script>

<main class="flex flex-col justify-between overflow-x-hidden">
    <header
        class="flex flex-col items-center bg-blue-800 text-white p-2 sm:p-3 border-b-2 sm:border-b-4 border-blue-950 shadow-lg"
    >
        <h1 class="font-bold text-2xl sm:text-3xl md:text-4xl">Word Gravity</h1>
    </header>

    <div class="flex flex-col">
        <div class="w-full h-full p-2 sm:p-3 md:p-4 flex justify-center">
            <WordGrid />
        </div>

        <div class="flex items-center gap-1 text-sm sm:text-base md:text-xl justify-center sm:p-4">
            <h1 class="">Current Turn:</h1>
            <h1 class="font-bold uppercase">{gameState.currentPlayerTurn}</h1>
        </div>

        <div class="flex justify-center px-2">
            <div class="flex flex-col sm:flex-row justify-center sm:justify-between gap-2 sm:gap-4 w-full max-w-md">
                <PlayerInfoPanel player="player" />
                <PlayerInfoPanel player="opponent" />
            </div>
        </div>

        <div class="w-full h-full p-2 sm:p-3 md:p-4 flex justify-center">
            <PlayerHand />
        </div>
    </div>
</main>
