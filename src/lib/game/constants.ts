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
