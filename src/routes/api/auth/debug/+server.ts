import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/**
 * Debug endpoint to check auth and profile status
 * Access at /api/auth/debug
 */
export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Get current session
		const {
			data: { session },
			error: sessionError,
		} = await locals.supabase.auth.getSession();

		if (sessionError) {
			return json({
				status: "error",
				sessionError: sessionError.message,
			});
		}

		if (!session?.user) {
			return json({
				status: "not_authenticated",
				message: "No active session",
			});
		}

		// Try to fetch profile
		const { data: profile, error: profileError } = await locals.supabase
			.from("profiles")
			.select("*")
			.eq("id", session.user.id)
			.single();

		// Get all profiles count
		const { count: profileCount } = await locals.supabase
			.from("profiles")
			.select("*", { count: "exact", head: true });

		// Get user metadata
		const userMetadata = session.user.user_metadata;

		return json({
			status: "authenticated",
			session: {
				user_id: session.user.id,
				email: session.user.email,
				created_at: session.user.created_at,
				confirmed_at: session.user.confirmed_at,
				email_confirmed_at: session.user.email_confirmed_at,
			},
			profile: profile || null,
			profileError: profileError ? profileError.message : null,
			userMetadata: userMetadata,
			totalProfiles: profileCount,
			locals: {
				hasUser: !!locals.user,
				user: locals.user,
			},
		});
	} catch (err) {
		return json(
			{
				status: "error",
				error: err instanceof Error ? err.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
};
