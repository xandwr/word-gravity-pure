/*
    $lib/game/sharedLetterBag.svelte.ts
    Single shared bag that both players draw from
*/

import { createLetterBag } from "$lib/game/letterBag.svelte";

export const sharedBag = createLetterBag();
