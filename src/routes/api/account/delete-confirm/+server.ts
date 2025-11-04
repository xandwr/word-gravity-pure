import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createSupabaseAdminClient } from "$lib/server/supabase";

/**
 * Confirm and execute account deletion
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { token, userId } = await request.json();

		if (!token || !userId) {
			return json(
				{ success: false, error: "Missing token or user ID" },
				{ status: 400 },
			);
		}

		const adminClient = createSupabaseAdminClient();

		// Get user and verify token
		const { data: userData, error: userError } =
			await adminClient.auth.admin.getUserById(userId);

		if (userError || !userData.user) {
			return json(
				{ success: false, error: "Invalid user" },
				{ status: 404 },
			);
		}

		const userMetadata = userData.user.user_metadata;
		const deletionToken = userMetadata?.deletion_token;
		const deletionExpires = userMetadata?.deletion_expires;

		// Verify token matches
		if (deletionToken !== token) {
			return json(
				{ success: false, error: "Invalid deletion token" },
				{ status: 403 },
			);
		}

		// Check if token has expired
		if (
			!deletionExpires ||
			new Date(deletionExpires) < new Date()
		) {
			return json(
				{ success: false, error: "Deletion token has expired" },
				{ status: 403 },
			);
		}

		// Delete user's profile first
		const { error: profileError } = await adminClient
			.from("profiles")
			.delete()
			.eq("id", userId);

		if (profileError) {
			console.error("Failed to delete profile:", profileError);
			// Continue anyway - profile might not exist
		}

		// Delete user's scores
		const { error: scoresError } = await adminClient
			.from("scores")
			.delete()
			.eq("user_id", userId);

		if (scoresError) {
			console.error("Failed to delete scores:", scoresError);
			// Continue anyway
		}

		// Finally, delete the auth user
		const { error: deleteError } =
			await adminClient.auth.admin.deleteUser(userId);

		if (deleteError) {
			console.error("Failed to delete user:", deleteError);
			return json(
				{ success: false, error: "Failed to delete account" },
				{ status: 500 },
			);
		}

		// Clear all Supabase cookies
		const cookiesToClear = cookies.getAll().filter((cookie) =>
			cookie.name.startsWith("sb-"),
		);

		cookiesToClear.forEach((cookie) => {
			cookies.delete(cookie.name, { path: "/" });
		});

		return json({
			success: true,
			message: "Account successfully deleted",
		});
	} catch (err) {
		console.error("Delete confirm error:", err);
		return json(
			{
				success: false,
				error: err instanceof Error ? err.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
};
