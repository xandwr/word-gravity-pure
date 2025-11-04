<script lang="ts">
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();

	let showDeleteModal = $state(false);
	let deleteConfirmText = $state("");
	let deleteLoading = $state(false);
	let deleteError = $state<string | null>(null);
	let deletionUrl = $state<string | null>(null);

	async function requestAccountDeletion() {
		deleteError = null;
		deleteLoading = true;

		try {
			const response = await fetch("/api/account/delete-request", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ confirmText: deleteConfirmText }),
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || "Failed to request deletion");
			}

			// Store the deletion URL for development
			if (result.deletionUrl) {
				deletionUrl = result.deletionUrl;
			}

			// Show success message
			alert(result.message + (result.deletionUrl ? "\n\nDev URL: " + result.deletionUrl : ""));
			showDeleteModal = false;
			deleteConfirmText = "";
		} catch (err) {
			deleteError = err instanceof Error ? err.message : "Something went wrong";
		} finally {
			deleteLoading = false;
		}
	}
</script>

<div class="flex items-center justify-center p-2 min-h-[calc(100vh-62px)]">
	<div class="max-w-2xl w-full backdrop-blur-sm rounded-lg shadow-xl p-8 space-y-6">
		<h1 class="text-3xl font-bold text-white text-center mb-4">My Profile</h1>

		<div class="space-y-4">
			<!-- User Info Section -->
			<div class="bg-white/5 rounded-lg p-4 border border-white/10">
				<h2 class="text-lg font-semibold text-white mb-3">Account Information</h2>

				<div class="space-y-2">
					<div class="flex justify-between items-center">
						<span class="text-white/60">Email:</span>
						<span class="text-white font-medium">{data.user.email}</span>
					</div>

					<div class="flex justify-between items-center">
						<span class="text-white/60">Username:</span>
						<span class="text-white font-medium">
							{data.user.username || 'Not set'}
						</span>
					</div>

					<div class="flex justify-between items-center">
						<span class="text-white/60">User ID:</span>
						<span class="text-white/40 font-mono text-xs">
							{data.user.id}
						</span>
					</div>
				</div>
			</div>

			<!-- Stats Section (placeholder for future) -->
			<div class="bg-white/5 rounded-lg p-4 border border-white/10">
				<h2 class="text-lg font-semibold text-white mb-3">Game Statistics</h2>
				<p class="text-white/60 text-sm">Coming soon...</p>
			</div>

			<!-- Danger Zone -->
			<div class="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
				<h2 class="text-lg font-semibold text-red-400 mb-3">Danger Zone</h2>
				<p class="text-white/60 text-sm mb-3">
					Once you delete your account, there is no going back. Please be certain.
				</p>
				<button
					onclick={() => showDeleteModal = true}
					class="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition"
				>
					Delete Account
				</button>
			</div>

			<!-- Actions -->
			<div class="flex gap-3">
				<a
					href="/"
					class="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded text-center transition"
				>
					Back to Game
				</a>
			</div>
		</div>
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<div
		class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
		onclick={(e) => {
			if (e.target === e.currentTarget) {
				showDeleteModal = false;
				deleteConfirmText = "";
				deleteError = null;
			}
		}}
	>
		<div class="bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-2xl border border-red-500/50">
			<h2 class="text-2xl font-bold text-red-400 mb-4">Delete Account</h2>

			<div class="space-y-4">
				<div class="bg-red-500/20 border border-red-500 rounded-lg p-4">
					<p class="text-red-300 font-semibold mb-2">Warning: This action cannot be undone!</p>
					<p class="text-white/70 text-sm">
						This will permanently delete your account, profile, and all game scores.
					</p>
				</div>

				<div>
					<p class="text-white/80 text-sm mb-2">
						Type <span class="font-mono font-bold text-red-400">DELETE MY ACCOUNT</span> to confirm:
					</p>
					<input
						type="text"
						bind:value={deleteConfirmText}
						placeholder="DELETE MY ACCOUNT"
						class="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
					/>
				</div>

				{#if deleteError}
					<div class="bg-red-500/20 border border-red-500 rounded-lg p-3">
						<p class="text-red-300 text-sm">{deleteError}</p>
					</div>
				{/if}

				{#if deletionUrl}
					<div class="bg-blue-500/20 border border-blue-500 rounded-lg p-3">
						<p class="text-blue-300 text-xs break-all">
							Dev Link: <a href={deletionUrl} class="underline">{deletionUrl}</a>
						</p>
					</div>
				{/if}

				<div class="flex gap-3">
					<button
						onclick={() => {
							showDeleteModal = false;
							deleteConfirmText = "";
							deleteError = null;
							deletionUrl = null;
						}}
						class="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded transition"
					>
						Cancel
					</button>
					<button
						onclick={requestAccountDeletion}
						disabled={deleteConfirmText !== "DELETE MY ACCOUNT" || deleteLoading}
						class="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{deleteLoading ? "Sending..." : "Send Confirmation Email"}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
