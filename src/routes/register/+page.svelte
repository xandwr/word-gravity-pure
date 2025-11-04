<script lang="ts">
    import { faDiscord, faGoogle } from "@fortawesome/free-brands-svg-icons";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { goto, invalidateAll } from "$app/navigation";
    import { getPlayerId } from "$lib/utils/playerIdentity";

    let username = "";
    let email = "";
    let password = "";
    let loading = false;
    let error: string | null = null;

    async function handleSubmit(e: Event) {
        e.preventDefault();
        error = null;
        loading = true;

        try {
            // Get the current anonymous player ID for migration
            const playerId = getPlayerId();

            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, username, playerId }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Registration failed");
            }

            // Invalidate all page data to refresh auth state
            await invalidateAll();

            // Redirect to home page after successful registration
            await goto("/");
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Something went wrong.";
        } finally {
            loading = false;
        }
    }

    function loginWith(provider: "discord" | "google") {
        console.log(`Redirecting to ${provider} OAuth...`);
        // TODO: Replace with real OAuth redirect when implemented
        // window.location.href = `/api/auth/${provider}`;
    }
</script>

<div class="flex items-center justify-center p-2 h-[calc(100vh-62px)]">
    <form
        on:submit={handleSubmit}
        class="max-w-md w-full backdrop-blur-sm rounded-lg shadow-xl p-8 space-y-5"
    >
        <h1 class="text-3xl font-bold text-white text-center mb-4">Register</h1>

        <div class="space-y-4">
            <input
                class="w-full p-1 rounded bg-white/10 text-white placeholder-white/50 border border-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                type="text"
                placeholder="Username"
                bind:value={username}
            />
            <input
                class="w-full p-1 rounded bg-white/10 text-white placeholder-white/50 border border-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                type="email"
                placeholder="Email"
                bind:value={email}
            />
            <input
                class="w-full p-1 rounded bg-white/10 text-white placeholder-white/50 border border-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                type="password"
                placeholder="Password"
                bind:value={password}
            />
        </div>

        {#if error}
            <p class="text-red-300 text-sm text-center">{error}</p>
        {/if}

        <button
            class="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded transition disabled:opacity-50"
            type="submit"
            disabled={loading}
        >
            {loading ? "Registering..." : "Create Account"}
        </button>

        <!-- Divider -->
        <div class="flex items-center">
            <div class="grow border-t border-white/20"></div>
            <span class="mx-3 text-white/60 text-sm">or</span>
            <div class="grow border-t border-white/20"></div>
        </div>

        <!-- Social login buttons -->
        <div class="flex flex-col gap-2">
            <button
                type="button"
                on:click={() => loginWith("google")}
                class="flex items-center justify-center gap-2 py-2 bg-white text-gray-800 font-semibold rounded hover:bg-gray-200 transition"
            >
                <FontAwesomeIcon icon={faGoogle} class="text-red-500 w-4 h-4" />
                Continue with Google
            </button>

            <button
                type="button"
                on:click={() => loginWith("discord")}
                class="flex items-center justify-center gap-2 py-2 bg-[#5865F2] text-white font-semibold rounded hover:bg-[#4752C4] transition"
            >
                <FontAwesomeIcon icon={faDiscord} class="w-4 h-4" />
                Continue with Discord
            </button>
        </div>
    </form>
</div>
