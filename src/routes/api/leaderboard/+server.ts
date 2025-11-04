/*
    API endpoint for leaderboard operations
    GET: Fetch leaderboard scores
    POST: Submit a new score
*/

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export interface LeaderboardEntry {
    username: string;
    score: number;
    timestamp: number;
    rank?: number;
    userId?: string;
}

// GET /api/leaderboard - Fetch top scores
export const GET: RequestHandler = async ({ locals }) => {
    try {
        const supabase = locals.supabase;

        // Query the leaderboard view we created
        const { data, error } = await supabase
            .from('leaderboard_global')
            .select('*')
            .limit(100);

        if (error) {
            console.error('Error fetching leaderboard:', error);
            return json(
                {
                    success: false,
                    error: 'Failed to fetch leaderboard'
                },
                { status: 500 }
            );
        }

        // Format the response
        const leaderboard: LeaderboardEntry[] = data.map(entry => ({
            username: entry.username,
            score: entry.score,
            timestamp: new Date(entry.created_at).getTime(),
            rank: entry.rank,
            userId: entry.user_id
        }));

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
export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const supabase = locals.supabase;
        const user = locals.user;

        console.log('=== Score Submission Request ===');
        console.log('User:', user?.id, user?.username, user?.email);

        // Check if user is authenticated
        if (!user) {
            console.log('❌ No user authenticated');
            return json(
                {
                    success: false,
                    error: 'You must be logged in to submit scores'
                },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { score } = body;
        console.log('Score to submit:', score);

        // Validate input
        if (typeof score !== 'number' || score < 0) {
            console.log('❌ Invalid score type or negative');
            return json(
                {
                    success: false,
                    error: 'Valid score is required'
                },
                { status: 400 }
            );
        }

        // Basic anti-cheat: reject suspiciously high scores
        const MAX_REASONABLE_SCORE = 10000;
        if (score > MAX_REASONABLE_SCORE) {
            console.log('❌ Score too high:', score);
            return json(
                {
                    success: false,
                    error: 'Score too high to be legitimate'
                },
                { status: 400 }
            );
        }

        // Insert the score into the database
        console.log('Attempting to insert score into database...');
        const { data: insertData, error: insertError } = await supabase
            .from('scores')
            .insert({
                user_id: user.id,
                mode: 'endless',
                score: score
            })
            .select();

        if (insertError) {
            console.error('❌ Error inserting score:', insertError);
            return json(
                {
                    success: false,
                    error: 'Failed to submit score'
                },
                { status: 500 }
            );
        }

        console.log('✅ Score inserted successfully:', insertData);

        // Get the user's new rank using the helper function
        const { data: rankData, error: rankError } = await supabase
            .rpc('get_user_leaderboard_position', { user_uuid: user.id })
            .single();

        if (rankError) {
            console.error('Error fetching rank:', rankError);
            // Still return success since the score was saved
            return json({
                success: true,
                rank: null,
                message: 'Score submitted successfully'
            });
        }

        return json({
            success: true,
            rank: rankData?.rank || null,
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
