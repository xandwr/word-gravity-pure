<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto, invalidateAll } from "$app/navigation";
    import { getUsername } from "$lib/utils/playerIdentity";

    let accountModalOpen = $state(false);
    let username = $state<string | null>(null);
    let isOfficialAccount = $state(false);

    // Props
    let { isMobile = false }: { isMobile?: boolean } = $props();

    // Reactive: Update username and auth state based on page data
    $effect(() => {
        const user = $page.data.user;
        if (user) {
            username = user.username || user.email;
            isOfficialAccount = true;
        } else {
            // Fall back to localStorage username if not authenticated
            username = getUsername();
            isOfficialAccount = false;
        }
    });

    onMount(() => {
        // Close account dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (
                accountModalOpen &&
                !target.closest(".account-dropdown-container")
            ) {
                accountModalOpen = false;
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    });

    function handleProfileAction() {
        if (isOfficialAccount) {
            window.location.href = "/profile";
        } else {
            window.location.href = "/register";
        }
        accountModalOpen = false;
    }

    function handleLogin() {
        window.location.href = "/login";
        accountModalOpen = false;
    }

    async function handleLogoutOrClearCache() {
        if (isOfficialAccount) {
            // Logout from official account
            try {
                const response = await fetch("/api/auth/logout", {
                    method: "POST",
                });

                if (response.ok) {
                    await invalidateAll();
                    await goto("/");
                } else {
                    console.error("Logout failed");
                }
            } catch (err) {
                console.error("Logout error:", err);
            }
        } else {
            // Clear local cache
            if (
                confirm(
                    "Are you sure you want to clear all local data? This will remove your stored username and game progress.",
                )
            ) {
                localStorage.clear();
                username = null;
                console.log("Local cache cleared");
            }
        }
        accountModalOpen = false;
    }
</script>

{#if isMobile}
    <!-- Mobile Account Section -->
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
            <div
                class="rounded-lg shadow-xl bg-none backdrop-blur-lg border-2 border-blue-900 mt-2 account-dropdown-container"
            >
                <div class="p-4 space-y-3">
                    {#if username}
                        <div class="text-center mb-3">
                            <p class="text-xs text-gray-300 mb-1">
                                Signed in as:
                            </p>
                            <p class="text-sm font-bold text-white">
                                {username}
                            </p>
                        </div>
                    {:else}
                        <div class="text-center mb-3">
                            <p class="text-xs text-white">No username set</p>
                        </div>
                    {/if}

                    <button
                        class="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors border-2 border-blue-700 text-sm"
                        onclick={handleProfileAction}
                    >
                        {isOfficialAccount ? "My Profile" : "Register"}
                    </button>

                    {#if !isOfficialAccount}
                        <button
                            class="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors border-2 border-green-700 text-sm"
                            onclick={handleLogin}
                        >
                            Login
                        </button>
                    {/if}

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
{:else}
    <!-- Desktop Account Section -->
    <div
        class="flex flex-col items-center gap-0.5 relative account-dropdown-container"
    >
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
                class="absolute top-full mt-3 border-2 border-blue-900 right-0 bg-none backdrop-blur-lg rounded-lg shadow-xl w-64 z-50 account-dropdown-container"
            >
                <div class="p-4 space-y-2">
                    {#if username}
                        <div class="text-center">
                            <p class="text-xs text-gray-300">Signed in as:</p>
                            <p class="text-sm font-bold text-white">
                                {username}
                            </p>
                        </div>
                    {:else}
                        <div class="text-center">
                            <p class="text-xs text-white">No username set</p>
                        </div>
                    {/if}

                    <button
                        class="w-full px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors border-2 border-blue-700 text-sm"
                        onclick={handleProfileAction}
                    >
                        {isOfficialAccount ? "My Profile" : "Register"}
                    </button>

                    {#if !isOfficialAccount}
                        <button
                            class="w-full px-2 py-1 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors border-2 border-green-700 text-sm"
                            onclick={handleLogin}
                        >
                            Login
                        </button>
                    {/if}

                    <button
                        class="w-full px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors border-2 border-gray-700 text-sm"
                        onclick={handleLogoutOrClearCache}
                    >
                        {isOfficialAccount ? "Logout" : "Clear Cache"}
                    </button>
                </div>
            </div>
        {/if}
    </div>
{/if}
