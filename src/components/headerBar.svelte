<script>
    let menuOpen = $state(false);
</script>

<header class="bg-blue-200 flex items-center justify-between p-4">
    <h1 class="text-xl font-bold">Word Gravity</h1>

    <!-- hamburger button -->
    <button
        class="md:hidden flex flex-col justify-center gap-1 p-2 hover:bg-blue-300 rounded"
        onclick={() => (menuOpen = !menuOpen)}
        aria-label="Toggle menu"
    >
        <span class="w-6 h-0.5 bg-black"></span>
        <span class="w-6 h-0.5 bg-black"></span>
        <span class="w-6 h-0.5 bg-black"></span>
    </button>

    <!-- desktop nav -->
    <nav class="hidden md:flex gap-4">
        <a href="/" class="hover:underline">Endless</a>
        <a href="/leaderboard" class="hover:underline">Leaderboard (coming soon)</a>
    </nav>
</header>

<!-- mobile dropdown -->
{#if menuOpen}
    <nav
        class="md:hidden flex flex-col bg-blue-100 border-t border-blue-300 p-4 gap-2"
    >
        <a href="/" class="hover:underline">Endless</a>
        <a href="/leaderboard" class="hover:underline">Leaderboard (coming soon)</a>
    </nav>
{/if}
