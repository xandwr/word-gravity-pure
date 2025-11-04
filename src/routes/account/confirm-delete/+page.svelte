<script lang="ts">
    import { goto, invalidateAll } from "$app/navigation";
    import { onMount } from "svelte";
    import { page } from "$app/stores";

    let loading = $state(false);
    let error = $state<string | null>(null);
    let success = $state(false);

    const token = $derived($page.url.searchParams.get("token"));
    const userId = $derived($page.url.searchParams.get("user_id"));

    async function confirmDeletion() {
        if (!token || !userId) {
            error = "Invalid deletion link";
            return;
        }

        loading = true;
        error = null;

        try {
            const response = await fetch("/api/account/delete-confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, userId }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Failed to delete account");
            }

            success = true;

            // Clear local storage and session storage
            localStorage.clear();
            sessionStorage.clear();

            // Wait a moment then redirect
            setTimeout(async () => {
                await invalidateAll();
                await goto("/");
            }, 3000);
        } catch (err) {
            error = err instanceof Error ? err.message : "Something went wrong";
        } finally {
            loading = false;
        }
    }
</script>

<div class="flex items-center justify-center p-4 min-h-[calc(100vh-62px)]">
    <div
        class="max-w-md w-full backdrop-blur-sm rounded-lg shadow-xl p-8 space-y-6"
    >
        <h1 class="text-3xl font-bold text-white text-center mb-4">
            Confirm Account Deletion
        </h1>

        {#if !token || !userId}
            <div class="bg-red-500/20 border border-red-500 rounded-lg p-4">
                <p class="text-red-300 text-center">
                    Invalid deletion link. Please try again.
                </p>
            </div>
            <a
                href="/profile"
                class="block w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded text-center transition"
            >
                Back to Profile
            </a>
        {:else if success}
            <div
                class="bg-green-500/20 border border-green-500 rounded-lg p-4"
            >
                <p class="text-green-300 text-center font-semibold mb-2">
                    Account Successfully Deleted
                </p>
                <p class="text-white/70 text-sm text-center">
                    Your account and all associated data have been permanently
                    deleted. Redirecting to home page...
                </p>
            </div>
        {:else}
            <div class="space-y-4">
                <div
                    class="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4"
                >
                    <p class="text-yellow-300 text-center font-semibold mb-2">
                        Warning: This action cannot be undone!
                    </p>
                    <p class="text-white/70 text-sm text-center">
                        Clicking "Delete My Account" will permanently delete:
                    </p>
                    <ul class="text-white/70 text-sm mt-2 space-y-1">
                        <li>• Your account and profile</li>
                        <li>• All your game scores</li>
                        <li>• All associated data</li>
                    </ul>
                </div>

                {#if error}
                    <div
                        class="bg-red-500/20 border border-red-500 rounded-lg p-4"
                    >
                        <p class="text-red-300 text-center">{error}</p>
                    </div>
                {/if}

                <div class="flex gap-3">
                    <a
                        href="/profile"
                        class="flex-1 py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded text-center transition"
                    >
                        Cancel
                    </a>
                    <button
                        onclick={confirmDeletion}
                        disabled={loading}
                        class="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition disabled:opacity-50"
                    >
                        {loading ? "Deleting..." : "Delete My Account"}
                    </button>
                </div>
            </div>
        {/if}
    </div>
</div>
