import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createSupabaseAdminClient } from "$lib/server/supabase";
import { VITE_SUPABASE_URL } from "$env/static/private";

/**
 * Request account deletion - sends confirmation email
 */
export const POST: RequestHandler = async ({ locals, request }) => {
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

		const { confirmText } = await request.json();

		// Verify user typed the correct confirmation
		if (confirmText !== "DELETE MY ACCOUNT") {
			return json(
				{ success: false, error: "Confirmation text does not match" },
				{ status: 400 },
			);
		}

		// Generate a secure deletion token (store in user metadata temporarily)
		const deletionToken = crypto.randomUUID();
		const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

		const adminClient = createSupabaseAdminClient();

		// Store deletion request in user metadata
		const { error: updateError } = await adminClient.auth.admin.updateUserById(
			session.user.id,
			{
				user_metadata: {
					...session.user.user_metadata,
					deletion_token: deletionToken,
					deletion_expires: expiresAt.toISOString(),
				},
			},
		);

		if (updateError) {
			console.error("Failed to create deletion request:", updateError);
			return json(
				{ success: false, error: "Failed to create deletion request" },
				{ status: 500 },
			);
		}

		// Get user profile for username
		const { data: profile } = await adminClient
			.from("profiles")
			.select("username")
			.eq("id", session.user.id)
			.single();

		// Call Supabase Edge Function to send deletion confirmation email
		const appUrl = new URL(request.url).origin;
		const edgeFunctionUrl = `${VITE_SUPABASE_URL}/functions/v1/send-deletion-email`;

		try {
			const emailResponse = await fetch(edgeFunctionUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: request.headers.get("Authorization") || "",
				},
				body: JSON.stringify({
					userId: session.user.id,
					email: session.user.email,
					username: profile?.username || session.user.email?.split("@")[0] || "User",
					deletionToken,
					appUrl,
				}),
			});

			const emailResult = await emailResponse.json();

			if (!emailResponse.ok) {
				console.error("Edge function error:", emailResult);
				// If email fails, still return the URL in dev mode
				return json({
					success: true,
					message: "Deletion request created. Email service unavailable.",
					deletionUrl:
						process.env.NODE_ENV === "development"
							? `${appUrl}/account/confirm-delete?token=${deletionToken}&user_id=${session.user.id}`
							: undefined,
				});
			}

			return json({
				success: true,
				message: "Deletion confirmation email sent. Please check your inbox.",
				// In development, also return the URL for testing
				deletionUrl:
					process.env.NODE_ENV === "development"
						? `${appUrl}/account/confirm-delete?token=${deletionToken}&user_id=${session.user.id}`
						: undefined,
			});
		} catch (emailError) {
			console.error("Failed to call edge function:", emailError);
			// Fallback: return URL in dev mode if email fails
			return json({
				success: true,
				message: "Deletion request created. Email service unavailable.",
				deletionUrl:
					process.env.NODE_ENV === "development"
						? `${new URL(request.url).origin}/account/confirm-delete?token=${deletionToken}&user_id=${session.user.id}`
						: undefined,
			});
		}
	} catch (err) {
		console.error("Delete request error:", err);
		return json(
			{
				success: false,
				error: err instanceof Error ? err.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
};
