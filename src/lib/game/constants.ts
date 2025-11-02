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
    // 0.0 = Pure offense (maximize own score)
    // 0.5 = Balanced (mix of scoring and blocking)
    // 1.0 = Maximum disruption (prioritize ruining player's words)
    AGGRESSIVENESS: 0.5,

    // Enable AI decision logging to console
    DEBUG_LOGGING: false
} as const;

// AI Difficulty Presets
export const AI_DIFFICULTY = {
    EASY: { AGGRESSIVENESS: 0.2 },
    MEDIUM: { AGGRESSIVENESS: 0.5 },
    HARD: { AGGRESSIVENESS: 0.8 }
} as const;
