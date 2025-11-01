<script>
    import LetterSlot from "./letterSlot.svelte";
</script>

<div class="flex gap-x-1">
    <div class="grid grid-cols-4 grid-rows-2 gap-1 w-fit h-fit">
        {#each Array(8) as _, index}
            <LetterSlot {index} />
        {/each}
    </div>
    <div class="flex flex-col gap-y-1">
        <div
            id="swapButton"
            class="text-4xl aspect-square rounded-xl border-4 bg-blue-200 flex flex-col items-center justify-center w-10 h-10 p-8"
        >
            <h>🔁</h>
            <h class="text-sm font-semibold">Swap</h>
        </div>

        <div
            id="stealButton"
            class="text-4xl aspect-square rounded-xl border-4 bg-orange-100 flex flex-col items-center justify-center w-10 h-10 p-8"
        >
            <h>🔓</h>
            <h class="text-sm font-semibold">Steal</h>
        </div>
    </div>
</div>
