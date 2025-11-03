// Game constants and theme configuration

export const PLAYER_COLORS = {
    player: {
        primary: '#22c55e',
        tailwind: 'bg-green-400/50',
        claimedTile: 'bg-green-400 text-green-950 border-green-600',
        name: 'You'
    },
    opponent: {
        primary: '#ef4444',
        tailwind: 'bg-red-400/50',
        claimedTile: 'bg-gray-400 text-gray-950 border-gray-600',
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
    AGGRESSIVENESS: 1.0,

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
