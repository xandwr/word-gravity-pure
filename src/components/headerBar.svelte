<script lang="ts">
    import { page } from "$app/state";

    let menuOpen = $state(false);
    let howToPlayOpen = $state(false);

    const currentPath = $derived(page.url.pathname);
</script>

<header
    class="bg-blue-900/10 flex items-center justify-between p-4 shadow-lg border-b-4 border-blue-600/10"
>
    <h1 class="text-3xl sm:text-4xl font-bold text-white tracking-tight">
        <a href="/">Word Gravity</a>
    </h1>

    <div class="flex items-center gap-8">
        <!-- lightbulb how-to-play button -->
        <button
            class="text-2xl p-1 hover:bg-blue-300 rounded-xl transition-colors border-2 border-black/20 bg-black/10 outline-1"
            onclick={() => (howToPlayOpen = !howToPlayOpen)}
            aria-label="How to Play"
            title="How to Play"
        >
            💡
        </button>

        <!-- hamburger button -->
        <button
            class="md:hidden flex flex-col justify-center gap-1 p-2 aspect-square hover:bg-blue-300 rounded-xl border-2 border-black/20 bg-black/10 outline-1"
            onclick={() => (menuOpen = !menuOpen)}
            aria-label="Toggle menu"
        >
            <span class="w-6 h-0.5 bg-white"></span>
            <span class="w-6 h-0.5 bg-white"></span>
            <span class="w-6 h-0.5 bg-white"></span>
        </button>

        <!-- desktop nav -->
        <nav class="hidden md:flex gap-4 text-white">
            <a
                href="/"
                class="hover:underline {currentPath === '/'
                    ? 'font-bold underline'
                    : ''}">Endless Mode</a
            >
            <a
                href="/leaderboard"
                class="hover:underline {currentPath === '/leaderboard'
                    ? 'font-bold underline'
                    : ''}">Leaderboard</a
            >
        </nav>
    </div>
</header>

<!-- mobile dropdown -->
{#if menuOpen}
    <nav
        class="md:hidden flex flex-col text-white bg-blue-900/20 border-t border-blue-300/20 p-4 gap-2"
    >
        <a
            href="/"
            class="hover:underline {currentPath === '/'
                ? 'font-bold underline'
                : ''}">Endless Mode</a
        >
        <a
            href="/leaderboard"
            class="hover:underline {currentPath === '/leaderboard'
                ? 'font-bold underline'
                : ''}">Leaderboard</a
        >
    </nav>
{/if}

<!-- How to Play Modal -->
{#if howToPlayOpen}
    <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onclick={() => (howToPlayOpen = false)}
        onkeydown={(e) => e.key === "Escape" && (howToPlayOpen = false)}
        role="button"
        tabindex="-1"
        aria-label="Close modal overlay"
    >
        <div
            class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="how-to-play-title"
            aria-modal="true"
            tabindex="-1"
        >
            <div
                class="sticky top-0 bg-blue-200 p-4 flex items-center justify-between border-b-2 border-blue-300"
            >
                <h2 id="how-to-play-title" class="text-2xl font-bold">
                    💡 How to Play
                </h2>
                <button
                    class="text-2xl hover:bg-blue-300 rounded p-2 transition-colors"
                    onclick={() => (howToPlayOpen = false)}
                    aria-label="Close"
                >
                    ✕
                </button>
            </div>

            <div class="p-6 space-y-6">
                <section>
                    <h3 class="text-xl font-bold mb-2">Goal</h3>
                    <p>
                        Words carry weight — drop letters, let gravity pull them
                        into place, and claim the strongest words before the
                        opponent (currently a bot) does.
                    </p>
                </section>

                <section>
                    <h3 class="text-xl font-bold mb-2">How to Play</h3>
                    <ol class="list-decimal list-inside space-y-2">
                        <li>
                            <strong>Place tiles:</strong> Drag letter tiles from
                            your hand to the board to form words.
                        </li>
                        <li>
                            <strong>Claim words:</strong> Tap/click on any tile in
                            a valid word to claim all tiles in that word.
                        </li>
                        <li>
                            <strong>Score points:</strong> Each tile has a base score
                            and multiplier. Your score is the sum of (base × multiplier)
                            for all tiles.
                        </li>
                        <li>
                            <strong>Gravity:</strong> After each turn, tiles fall
                            down if there's empty space below them.
                        </li>
                    </ol>
                </section>

                <section>
                    <h3 class="text-xl font-bold mb-2">Controls</h3>
                    <ul class="list-disc list-inside space-y-2">
                        <li>
                            <strong>Desktop:</strong> Click and drag tiles, or click
                            to claim words
                        </li>
                        <li>
                            <strong>Mobile:</strong> Touch and drag tiles, or tap
                            to claim words
                        </li>
                        <li>
                            <strong>Swap:</strong> Drag tiles to the swap button
                            to exchange them (limited swaps)
                        </li>
                    </ul>
                </section>

                <section>
                    <h3 class="text-xl font-bold mb-2">Tile Colors:</h3>
                    <ol class="list-decimal list-inside space-y-2">
                        <p>
                            <span class="font-bold" style="color: #b4e1ff;"
                                >Blue</span
                            >: This is part of one of your valid horizontal
                            words
                        </p>
                        <p>
                            <span class="font-bold" style="color: #ffb347;"
                                >Orange</span
                            >: This is part of one of your valid vertical words
                        </p>
                        <p>
                            <span class="font-bold" style="color: #a020f0;"
                                >Purple</span
                            >: This tile is part of both a horizontal AND
                            vertical word you can claim
                        </p>
                        <p>
                            <span class="font-bold" style="color: #ff3333;"
                                >Red</span
                            >: This is one of the opponent's tiles
                        </p>
                        <p>
                            <span class="font-bold" style="color: #ff33aa;"
                                >Pink</span
                            >: This is both yours AND your opponent's tile
                        </p>
                    </ol>
                </section>

                <section>
                    <h3 class="text-xl font-bold mb-2">Tile Multipliers</h3>
                    <div class="space-y-1">
                        <p>
                            <span class="font-bold" style="color: #b4e1ff;"
                                >2x</span
                            > - Light Blue
                        </p>
                        <p>
                            <span class="font-bold" style="color: #7ef0a0;"
                                >3x</span
                            > - Mint Green
                        </p>
                        <p>
                            <span class="font-bold" style="color: #f9f871;"
                                >4x</span
                            > - Yellow
                        </p>
                        <p>
                            <span class="font-bold" style="color: #ffb347;"
                                >5x</span
                            > - Orange
                        </p>
                        <p>
                            <span class="font-bold" style="color: #ff7033;"
                                >6x</span
                            > - Dark Orange (glowing)
                        </p>
                        <p>
                            <span class="font-bold" style="color: #ff3333;"
                                >7x</span
                            > - Red (glowing)
                        </p>
                        <p>
                            <span class="font-bold" style="color: #a020f0;"
                                >8x</span
                            > - Purple (glowing)
                        </p>
                        <p>
                            <span class="font-bold" style="color: #a020f0;"
                                >9x+</span
                            > - Transcendent (pulsing white glow)
                        </p>
                    </div>
                </section>

                <section>
                    <h3 class="text-xl font-bold mb-2">Tips</h3>
                    <ul class="list-disc list-inside space-y-2">
                        <li>
                            Look for intersecting words to maximize your claims
                        </li>
                        <li>Higher multiplier tiles are worth more points</li>
                        <li>Plan ahead - tiles fall after each turn</li>
                        <li>
                            Use swaps strategically when you have difficult
                            letters
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    </div>
{/if}
