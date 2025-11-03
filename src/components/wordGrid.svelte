<!--
    components/wordGrid.svelte
-->

<script lang="ts">
    import LetterSlot from "./letterSlot.svelte";
    import { gameState, BOARD_CONFIG } from "$lib/game/state.svelte";

    const difficulties = ["EASY", "MEDIUM", "HARD", "NIGHTMARE"] as const;

    function handleDifficultyChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        const difficulty = select.value as
            | "EASY"
            | "MEDIUM"
            | "HARD"
            | "NIGHTMARE";
        gameState.setAiDifficulty(difficulty);
    }
</script>

<div class="text-white drop-shadow-[0px_1px_0px_#00AAFF88]">
    <div class="flex flex-col items-center">
        <div class="flex items-center-safe gap-2 justify-center mb-2">
            <h1
                class="text-xl sm:text-2xl font-semibold text-center tracking-tight"
            >
                Endless Mode
            </h1>
            <h1>—</h1>
            <select
                class="text-lg sm:text-xl font-semibold text-center tracking-tight bg-transparent border border-white/30 rounded px-2 py-0 cursor-pointer hover:border-white/60 transition-colors"
                value={gameState.aiDifficulty}
                onchange={handleDifficultyChange}
            >
                {#each difficulties as diff}
                    <option value={diff} class="bg-gray-900 text-white">
                        {diff}
                    </option>
                {/each}
            </select>
        </div>
        <div class="flex flex-row gap-4">
            <h1>Minimum Letters: 0</h1>
            <p class="font-light">|</p>
            <h1>AI Skill: 0</h1>
        </div>
    </div>

    <div
        class="text-black grid gap-px w-fit max-w-full sm:max-w-[90vw] md:max-w-[728px] h-fit mx-auto"
        style="grid-template-columns: repeat({BOARD_CONFIG.COLS}, minmax(0, 1fr)); grid-template-rows: repeat({BOARD_CONFIG.ROWS}, minmax(0, 1fr));"
    >
        {#each gameState.board as slot, index}
            <LetterSlot {index} tile={slot.heldLetterTile} slotType="board" />
        {/each}
    </div>
</div>
