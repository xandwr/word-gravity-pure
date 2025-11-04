<!-- routes/+page.svelte -->

<script lang="ts">
    import { page } from "$app/state";
</script>

<svelte:head>
    <title>Word Gravity</title>
</svelte:head>

<div
    class="flex flex-col items-center justify-center bg-linear-to-b from-blue-100 to-purple-100 p-8"
>
    <div class="max-w-2xl text-center">
        <h1 class="text-5xl font-bold mb-6 text-gray-800">Word Gravity</h1>
        <p class="text-xl text-gray-600 mb-8">
            A word-building game where letters fall with gravity!
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a
                href="/endless"
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors text-lg"
            >
                Play Endless Mode
            </a>
            <a
                href="/leaderboard"
                class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg transition-colors text-lg"
            >
                View Leaderboard
            </a>
        </div>
    </div>
</div>
