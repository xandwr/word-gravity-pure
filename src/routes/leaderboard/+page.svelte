<!--
    Leaderboard Page
-->

<script lang="ts">
    import type { PageData } from "./$types";

    let { data } = $props<{ data: PageData }>();

    function formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getRankColor(rank: number): string {
        if (rank === 1) return "text-yellow-600 font-extrabold";
        if (rank === 2) return "text-gray-400 font-bold";
        if (rank === 3) return "text-amber-700 font-bold";
        return "text-gray-600";
    }

    function getRankBg(rank: number): string {
        if (rank === 1) return "bg-yellow-50 border-yellow-300";
        if (rank === 2) return "bg-gray-50 border-gray-300";
        if (rank === 3) return "bg-amber-50 border-amber-300";
        return "bg-white border-gray-200";
    }
</script>

<svelte:head>
    <title>Word Gravity | Leaderboard</title>
</svelte:head>

<div class="bg-white px-4 py-1">
    <div class="max-w-4xl">
        <!-- Header -->
        <div class="text-center mb-8 pt-8">
            <h1 class="text-4xl sm:text-5xl font-bold text-gray-800 mb-2">
                Global Leaderboard
            </h1>
        </div>

        <!-- Back to Game Button -->
        <div class="mb-6">
            <a
                href="/"
                class="gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
                <span>←</span>
                <span>Back to Endless</span>
            </a>
        </div>

        <!-- Leaderboard Content -->
        {#if data.error}
            <div
                class="bg-red-100 border-2 border-red-400 rounded-lg p-6 text-center"
            >
                <p class="text-red-800 font-semibold">{data.error}</p>
                <p class="text-red-600 mt-2">
                    Y'all just wait though...
                </p>
            </div>
        {:else if data.leaderboard.length === 0}
            <div
                class="bg-gray-100 border-2 border-gray-300 rounded-lg p-8 text-center"
            >
                <p class="text-gray-600 text-lg font-semibold">
                    No scores yet!
                </p>
                <p class="text-gray-500 mt-2">
                    Be the first to submit a score.
                </p>
                <a
                    href="/"
                    class="inline-block mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                >
                    Play Now
                </a>
            </div>
        {:else}
            <div
                class="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200"
            >
                <!-- Table Header -->
                <div
                    class="grid grid-cols-[80px_1fr_120px_180px] gap-4 px-4 sm:px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold items-center"
                >
                    <div class="text-center">Rank</div>
                    <div>Player</div>
                    <div class="text-right">Score</div>
                    <div class="text-right hidden sm:block">Date</div>
                </div>

                <!-- Table Body -->
                <div class="divide-y-2 divide-gray-100">
                    {#each data.leaderboard as entry, index}
                        <div
                            class="grid grid-cols-[80px_1fr_120px_180px] gap-4 px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors border-l-4 items-center {getRankBg(
                                entry.rank || index + 1,
                            )}"
                        >
                            <!-- Rank -->
                            <div
                                class="text-center font-bold text-xl {getRankColor(
                                    entry.rank || index + 1,
                                )}"
                            >
                                {#if entry.rank === 1}
                                    🥇
                                {:else if entry.rank === 2}
                                    🥈
                                {:else if entry.rank === 3}
                                    🥉
                                {:else}
                                    #{entry.rank || index + 1}
                                {/if}
                            </div>

                            <!-- Username -->
                            <div class="font-semibold text-gray-800 truncate">
                                {entry.username}
                            </div>

                            <!-- Score -->
                            <div
                                class="text-right font-bold text-lg text-blue-600"
                            >
                                {entry.score}
                            </div>

                            <!-- Date -->
                            <div
                                class="text-right text-sm text-gray-500 hidden sm:block whitespace-nowrap"
                            >
                                {formatDate(entry.timestamp)}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Total Entries Count -->
            <div class="text-center mt-6 text-gray-600">
                Showing {data.leaderboard.length}
                {data.leaderboard.length === 1 ? "entry" : "entries"}
            </div>
        {/if}
    </div>
</div>
