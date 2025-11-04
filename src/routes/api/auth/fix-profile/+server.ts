import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/**
 * Manual profile creation endpoint for fixing missing profiles
 * Call this if you're logged in but don't have a profile
 */
export const POST: RequestHandler = async ({ locals }) => {
	try {
		const {
			data: { session },
		} = await locals.supabase.auth.getSession();

		if (!session?.user) {
			return json(
				{ success: false, error: "Not authenticated" },
				{ status: 401 },
			);
		}

		// Check if profile already exists
		const { data: existingProfile, error: checkError } = await locals.supabase
			.from("profiles")
			.select("*")
			.eq("id", session.user.id)
			.maybeSingle();

		if (existingProfile) {
			return json({
				success: true,
				message: "Profile already exists",
				profile: existingProfile,
			});
		}

		// Get username from metadata or generate from email
		const username =
			session.user.user_metadata?.username ||
			session.user.email?.split("@")[0] ||
			`user_${session.user.id.substring(0, 8)}`;

		// Create the profile
		const { data: newProfile, error: insertError } = await locals.supabase
			.from("profiles")
			.insert({
				id: session.user.id,
				username: username,
			})
			.select()
			.single();

		if (insertError) {
			console.error("Failed to create profile:", insertError);
			return json(
				{
					success: false,
					error: insertError.message,
					code: insertError.code,
				},
				{ status: 500 },
			);
		}

		return json({
			success: true,
			message: "Profile created successfully",
			profile: newProfile,
		});
	} catch (err) {
		console.error("Fix profile error:", err);
		return json(
			{
				success: false,
				error: err instanceof Error ? err.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
};
