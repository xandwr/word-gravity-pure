<script lang="ts">
    import { faDiscord, faGoogle } from "@fortawesome/free-brands-svg-icons";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { goto } from "$app/navigation";

    let email = "";
    let password = "";
    let loading = false;
    let error: string | null = null;

    async function handleSubmit(e: Event) {
        e.preventDefault();
        error = null;
        loading = true;

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Login failed");
            }

            // Redirect to home page after successful login
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
        <h1 class="text-3xl font-bold text-white text-center mb-4">Login</h1>

        <div class="space-y-4">
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
            class="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded transition disabled:opacity-50"
            type="submit"
            disabled={loading}
        >
            {loading ? "Logging in..." : "Login"}
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

        <!-- Register link -->
        <div class="text-center text-sm text-white/70">
            Don't have an account?
            <a href="/register" class="text-blue-400 hover:text-blue-300 underline">
                Register here
            </a>
        </div>
    </form>
</div>
