// Game constants and theme configuration

export const PLAYER_COLORS = {
    player: {
        primary: '#22c55e',                              // green-500
        tailwind: 'bg-green-400',                        // Tailwind class for backgrounds
        claimedTile: 'bg-green-400 text-green-950 border-green-600', // Claimed tile styles
        name: 'You'
    },
    opponent: {
        primary: '#ef4444',                              // red-500
        tailwind: 'bg-red-400',                          // Tailwind class for backgrounds
        claimedTile: 'bg-gray-400 text-gray-950 border-gray-600',    // Claimed tile styles
        name: 'Opponent'
    }
} as const;

export type PlayerType = 'player' | 'opponent';

// AI Configuration
export const AI_CONFIG = {
    // Aggressiveness level (0-1)
    // 0.0 = Pure offense, patient strategy (builds words, waits for high multipliers)
    // 0.5 = Balanced (good mix of scoring and strategic blocking)
    // 1.0 = Maximum chaos (aggressive claiming, ruthless blocking, fast-paced)
    AGGRESSIVENESS: 0.5,

    // Enable AI decision logging to console (useful for debugging AI behavior)
    DEBUG_LOGGING: true
} as const;

// AI Difficulty Presets
export const AI_DIFFICULTY = {
    EASY: { AGGRESSIVENESS: 0.1 },      // Passive, focuses only on making words
    MEDIUM: { AGGRESSIVENESS: 0.5 },    // Smart and balanced - the default
    HARD: { AGGRESSIVENESS: 0.85 },     // Ruthless and terrifying
    NIGHTMARE: { AGGRESSIVENESS: 1.0 }  // Pure evil
} as const;
