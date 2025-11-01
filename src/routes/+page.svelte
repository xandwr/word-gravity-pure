<script>
    import WordGrid from "../components/wordGrid.svelte";
    import PlayerHand from "../components/playerHand.svelte";
</script>

<main class="flex flex-col justify-between">
    <header class="flex flex-col items-center bg-blue-800 text-white p-3 border-b-4 border-blue-950 shadow-lg">
        <h1 class="font-bold text-4xl">Word Gravity</h1>
    </header>

    <div class="flex flex-col">
        <div class="bg-red-500 w-full h-full p-4 flex justify-center">
            <WordGrid />
        </div>
        
        <div class="bg-purple-500 w-full h-full p-4 flex justify-center">
            <PlayerHand />
        </div>
    </div>
</main>
