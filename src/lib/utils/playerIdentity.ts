/*
    Player Identity Management
    Handles persistent player ID (UUID) and username stored in localStorage
*/

const STORAGE_KEYS = {
    PLAYER_ID: 'wordgravity_player_id',
    USERNAME: 'wordgravity_username'
} as const;

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Get or create a persistent player ID
 * This ID is stored in localStorage and persists across sessions
 */
export function getPlayerId(): string {
    if (typeof window === 'undefined') {
        return ''; // SSR fallback
    }

    let playerId = localStorage.getItem(STORAGE_KEYS.PLAYER_ID);

    if (!playerId) {
        playerId = generateUUID();
        localStorage.setItem(STORAGE_KEYS.PLAYER_ID, playerId);
    }

    return playerId;
}

/**
 * Get the stored username
 */
export function getUsername(): string | null {
    if (typeof window === 'undefined') {
        return null; // SSR fallback
    }

    return localStorage.getItem(STORAGE_KEYS.USERNAME);
}

/**
 * Save username to localStorage
 */
export function saveUsername(username: string): void {
    if (typeof window === 'undefined') {
        return; // SSR fallback
    }

    localStorage.setItem(STORAGE_KEYS.USERNAME, username);
}

/**
 * Clear stored username (for testing or name changes)
 */
export function clearUsername(): void {
    if (typeof window === 'undefined') {
        return; // SSR fallback
    }

    localStorage.removeItem(STORAGE_KEYS.USERNAME);
}

/**
 * Get player identity object
 */
export function getPlayerIdentity(): { playerId: string; username: string | null } {
    return {
        playerId: getPlayerId(),
        username: getUsername()
    };
}
