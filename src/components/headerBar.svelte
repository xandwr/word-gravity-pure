<script lang="ts">
    import { Fa } from "svelte-fa";
    import { faDiscord } from "@fortawesome/free-brands-svg-icons";
    import { page } from "$app/state";
    import { onMount } from "svelte";
    import { getUsername } from "$lib/utils/playerIdentity";

    let menuOpen = $state(false);
    let howToPlayOpen = $state(false);
    let accountModalOpen = $state(false);
    let username = $state<string | null>(null);

    // For now, all users are local-only (no official account system yet)
    // In the future, this will check if the user has authenticated with the backend
    let isOfficialAccount = $state(false);

    const currentPath = $derived(page.url.pathname);

    onMount(() => {
        username = getUsername();
        // TODO: Check if user has an official account when backend is ready
        // isOfficialAccount = checkOfficialAccountStatus();

        // Close account dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (accountModalOpen && !target.closest('.account-dropdown-container')) {
                accountModalOpen = false;
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });

    function handleProfileAction() {
        if (isOfficialAccount) {
            // TODO: Navigate to profile page
            console.log("Navigate to profile");
        } else {
            // TODO: Navigate to registration page
            console.log("Navigate to registration");
        }
        accountModalOpen = false;
    }

    function handleLogoutOrClearCache() {
        if (isOfficialAccount) {
            // TODO: Logout from official account
            console.log("Logout from account");
        } else {
            // Clear local cache
            if (confirm("Are you sure you want to clear all local data? This will remove your stored username and game progress.")) {
                localStorage.clear();
                username = null;
                console.log("Local cache cleared");
            }
        }
        accountModalOpen = false;
    }

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/endless", label: "Endless" },
        { href: "/leaderboard", label: "Leaderboard" },
        {
            href: "https://discord.gg/r8rbntTaKQ",
            label: "xander's lab Discord",
            icon: faDiscord,
            iconType: "fa",
        },
        {
            href: "https://ko-fi.com/xandwr",
            label: "Send a tip!",
            icon: "/icons/kofi-icon.png",
            iconType: "img",
        },
    ];
</script>

<header
    class="bg-blue-900/10 flex items-center justify-between px-4 py-1.5 shadow-lg border-b-4 border-blue-600/10"
>
    <div class="flex flex-row items-end gap-1">
        <h1
            class="text-3xl sm:text-4xl font-bold text-white tracking-tight text-nowrap"
        >
            <a href="/">Word Gravity</a>
        </h1>
        <h3
            class="text-xs sm:text-sm sm:translate-y-0.5 font-semibold text-neutral-400 tracking-tight"
        >
            <a href="/">v0.1</a>
        </h3>
    </div>

    <div class="flex items-center gap-4">
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
        <nav class="hidden md:flex gap-4 text-white items-center">
            <!-- Separator before nav links -->
            <div class="h-6 w-px bg-white/30 mx-2"></div>

            {#each navLinks as link, index}
                {#if index === 3}
                    <div class="h-6 w-px bg-white/30 mx-2"></div>
                {/if}
                <a
                    href={link.href}
                    class="hover:underline {currentPath === link.href
                        ? 'font-bold underline'
                        : ''} {link.icon
                        ? link.iconType === 'fa'
                            ? 'hover:text-[#5865F2] transition-colors'
                            : 'hover:opacity-80 transition-opacity'
                        : ''}"
                >
                    {#if link.icon}
                        {#if link.iconType === "fa"}
                            <Fa icon={link.icon as any} size="lg" />
                        {:else if link.iconType === "img"}
                            <img
                                src={link.icon as string}
                                alt={link.label}
                                class="w-6 h-6 inline-block"
                            />
                        {/if}
                    {:else}
                        {link.label}
                    {/if}
                </a>
            {/each}

            <!-- Separator before account button -->
            <div class="h-6 w-px bg-white/30 mx-2"></div>

            <!-- Account section -->
            <div class="flex flex-col items-center gap-0.5 relative account-dropdown-container">
                <span class="text-xs text-white/60">Account:</span>
                <button
                    class="px-3 py-0 hover:bg-blue-300/20 rounded-lg transition-colors border border-white/20"
                    onclick={() => (accountModalOpen = !accountModalOpen)}
                >
                    {username || "Login"}
                </button>

                <!-- Desktop Account Dropdown -->
                {#if accountModalOpen}
                    <div
                        class="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl w-64 border-2 border-blue-300 z-50 account-dropdown-container"
                    >
                        <div class="p-4 space-y-3">
                            {#if username}
                                <div class="text-center mb-3">
                                    <p class="text-xs text-gray-600 mb-1">Signed in as:</p>
                                    <p class="text-sm font-bold text-gray-800">{username}</p>
                                </div>
                            {:else}
                                <div class="text-center mb-3">
                                    <p class="text-xs text-gray-600">No username set</p>
                                </div>
                            {/if}

                            <button
                                class="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors border-2 border-blue-700 text-sm"
                                onclick={handleProfileAction}
                            >
                                {isOfficialAccount ? "My Profile" : "Register"}
                            </button>

                            <button
                                class="w-full px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors border-2 border-gray-700 text-sm"
                                onclick={handleLogoutOrClearCache}
                            >
                                {isOfficialAccount ? "Logout" : "Clear Cache"}
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        </nav>
    </div>
</header>

<!-- mobile dropdown -->
{#if menuOpen}
    <nav
        class="md:hidden flex flex-col text-white bg-blue-900/20 border-t border-blue-300/20 p-4 gap-2"
    >
        <!-- Account section (mobile) -->
        <div class="flex flex-col gap-1 account-dropdown-container">
            <span class="text-xs text-white/60">Account:</span>
            <button
                class="px-3 py-2 hover:bg-blue-300/20 rounded-lg transition-colors border border-white/20 text-left"
                onclick={() => (accountModalOpen = !accountModalOpen)}
            >
                {username || "Login"}
            </button>

            <!-- Mobile Account Dropdown -->
            {#if accountModalOpen}
                <div class="bg-white rounded-lg shadow-xl border-2 border-blue-300 mt-2 account-dropdown-container">
                    <div class="p-4 space-y-3">
                        {#if username}
                            <div class="text-center mb-3">
                                <p class="text-xs text-gray-600 mb-1">Signed in as:</p>
                                <p class="text-sm font-bold text-gray-800">{username}</p>
                            </div>
                        {:else}
                            <div class="text-center mb-3">
                                <p class="text-xs text-gray-600">No username set</p>
                            </div>
                        {/if}

                        <button
                            class="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors border-2 border-blue-700 text-sm"
                            onclick={handleProfileAction}
                        >
                            {isOfficialAccount ? "My Profile" : "Register"}
                        </button>

                        <button
                            class="w-full px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors border-2 border-gray-700 text-sm"
                            onclick={handleLogoutOrClearCache}
                        >
                            {isOfficialAccount ? "Logout" : "Clear Cache"}
                        </button>
                    </div>
                </div>
            {/if}
        </div>

        <div class="h-px w-full bg-white/30 my-2"></div>

        {#each navLinks as link, index}
            {#if index === 3}
                <div class="h-px w-full bg-white/30 my-2"></div>
            {/if}
            <a
                href={link.href}
                class="hover:underline {currentPath === link.href
                    ? 'font-bold underline'
                    : ''} flex items-center gap-2"
            >
                {#if link.icon}
                    {#if link.iconType === "fa"}
                        <Fa icon={link.icon as any} />
                    {:else if link.iconType === "img"}
                        <img
                            src={link.icon as string}
                            alt={link.label}
                            class="w-5 h-5"
                        />
                    {/if}
                {/if}
                {link.label}
            </a>
        {/each}
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

                <hr class="border-t-2 border-gray-300">

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

                <hr class="border-t-2 border-gray-300">

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
                    </ul>
                </section>

                <hr class="border-t-2 border-gray-300">

                <section>
                    <h3 class="text-xl font-bold mb-2">Swap System</h3>
                    <p class="mb-2">
                        Swaps let you exchange unwanted tiles for better options:
                    </p>
                    <ul class="list-disc list-inside space-y-2">
                        <li>
                            <strong>Start with 5 swaps</strong> - Each game begins with 5 swap uses
                        </li>
                        <li>
                            <strong>Earn more swaps</strong> - Gain +1 swap every time you claim a word
                        </li>
                        <li>
                            <strong>1 swap per turn limit</strong> - You can only use 1 swap per turn, regardless of how many you have
                        </li>
                        <li>
                            <strong>Swap with bag:</strong> Drag a hand tile to the swap button to choose a tile from the bag
                        </li>
                        <li>
                            <strong>Swap with board:</strong> Drag a hand tile onto any tile on the board to swap them directly
                        </li>
                        <li>
                            <strong>Steal words:</strong> When you swap a tile on the board that's part of an opponent's word, you gain ownership of that word!
                        </li>
                        <li>
                            <strong>Visual feedback:</strong> When dragging a tile, the swap button pulses with a blue glow if you have a swap available
                        </li>
                        <li>
                            <strong>Strategic use:</strong> Swaps don't end your turn, so use them to set up better plays or hijack opponent words
                        </li>
                    </ul>
                </section>

                <hr class="border-t-2 border-gray-300">

                <section>
                    <h3 class="text-xl font-bold mb-2">Word Ownership</h3>
                    <p class="mb-2">
                        Words can change ownership during the game:
                    </p>
                    <ul class="list-disc list-inside space-y-2">
                        <li>
                            <strong>Creating words:</strong> When you place tiles that form a new word, you own it
                        </li>
                        <li>
                            <strong>Extending words:</strong> If you add tiles to an existing word, making it longer, you take ownership
                        </li>
                        <li>
                            <strong>Overwriting tiles:</strong> If you swap a tile that's part of an opponent's word, you steal ownership of that entire word
                        </li>
                        <li>
                            <strong>Example:</strong> If the opponent has "CAT" and you swap the "A" for an "U" (making "CUT"), the word becomes yours!
                        </li>
                    </ul>
                </section>

                <hr class="border-t-2 border-gray-300">

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

                <hr class="border-t-2 border-gray-300">

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

                <hr class="border-t-2 border-gray-300">

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
