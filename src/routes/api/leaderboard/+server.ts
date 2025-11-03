/*
    API endpoint for leaderboard operations
    GET: Fetch leaderboard scores
    POST: Submit a new score
*/

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { kv } from '@vercel/kv';

export interface LeaderboardEntry {
    username: string;
    score: number;
    timestamp: number;
    rank?: number;
}

const LEADERBOARD_KEY = 'leaderboard:global:alltime';
const MAX_LEADERBOARD_SIZE = 100; // Keep top 100 scores

// GET /api/leaderboard - Fetch top scores
export const GET: RequestHandler = async () => {
    try {
        // Get top scores from KV sorted set (highest scores first)
        const topScores = await kv.zrange(LEADERBOARD_KEY, 0, 99, {
            rev: true, // Highest scores first
            withScores: true
        });

        // Format the response
        const leaderboard: LeaderboardEntry[] = [];

        for (let i = 0; i < topScores.length; i += 2) {
            const entryData = topScores[i] as string;
            const score = topScores[i + 1] as number;

            try {
                const parsed = JSON.parse(entryData);
                leaderboard.push({
                    username: parsed.username,
                    score: score,
                    timestamp: parsed.timestamp,
                    rank: leaderboard.length + 1
                });
            } catch (e) {
                console.error('Failed to parse leaderboard entry:', e);
            }
        }

        return json({
            success: true,
            leaderboard
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return json(
            {
                success: false,
                error: 'Failed to fetch leaderboard'
            },
            { status: 500 }
        );
    }
};

// POST /api/leaderboard - Submit a new score
export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const { username, score } = body;

        // Validate input
        if (!username || typeof username !== 'string') {
            return json(
                {
                    success: false,
                    error: 'Username is required'
                },
                { status: 400 }
            );
        }

        if (typeof score !== 'number' || score < 0) {
            return json(
                {
                    success: false,
                    error: 'Valid score is required'
                },
                { status: 400 }
            );
        }

        // Sanitize username
        const sanitizedUsername = username.trim().slice(0, 20);
        if (sanitizedUsername.length === 0) {
            return json(
                {
                    success: false,
                    error: 'Username cannot be empty'
                },
                { status: 400 }
            );
        }

        // Create entry data
        const entryData = JSON.stringify({
            username: sanitizedUsername,
            timestamp: Date.now()
        });

        // Add to sorted set (score is the sorting value)
        await kv.zadd(LEADERBOARD_KEY, {
            score: score,
            member: entryData
        });

        // Trim to keep only top MAX_LEADERBOARD_SIZE entries
        const currentSize = await kv.zcard(LEADERBOARD_KEY);
        if (currentSize > MAX_LEADERBOARD_SIZE) {
            await kv.zremrangebyrank(LEADERBOARD_KEY, 0, currentSize - MAX_LEADERBOARD_SIZE - 1);
        }

        // Get the rank of this score
        const rank = await kv.zrevrank(LEADERBOARD_KEY, entryData);

        return json({
            success: true,
            rank: rank !== null ? rank + 1 : null,
            message: 'Score submitted successfully'
        });
    } catch (error) {
        console.error('Error submitting score:', error);
        return json(
            {
                success: false,
                error: 'Failed to submit score'
            },
            { status: 500 }
        );
    }
};
