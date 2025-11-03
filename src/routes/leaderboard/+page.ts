/*
    Fetch leaderboard data server-side
*/

import type { PageLoad } from './$types';

export interface LeaderboardEntry {
    username: string;
    score: number;
    timestamp: number;
    rank?: number;
}

export const load: PageLoad = async ({ fetch }) => {
    try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();

        if (data.success) {
            return {
                leaderboard: data.leaderboard as LeaderboardEntry[],
                error: null
            };
        } else {
            return {
                leaderboard: [],
                error: data.error || 'Failed to load leaderboard'
            };
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        return {
            leaderboard: [],
            error: 'Network error loading leaderboard'
        };
    }
};
