/*
    $lib/game/sharedLetterBag.svelte.ts
    Single shared bag that both players draw from
*/

import { createLetterBag } from "$lib/game/letterBag.svelte";

// Create reactive bag state
export const sharedBag = $state(createLetterBag());
