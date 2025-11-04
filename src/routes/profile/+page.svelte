<script lang="ts">
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
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
