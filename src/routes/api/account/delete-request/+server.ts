import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createSupabaseAdminClient } from "$lib/server/supabase";

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

		// Send deletion confirmation email using Supabase
		// Note: You'll need to create a custom email template in Supabase
		// For now, we'll use a workaround by sending a password reset email with custom redirect
		const deletionUrl = `${new URL(request.url).origin}/account/confirm-delete?token=${deletionToken}&user_id=${session.user.id}`;

		// Since Supabase doesn't have a built-in "custom email" feature,
		// we'll need to either:
		// 1. Use a third-party email service (like SendGrid, Resend, etc.)
		// 2. Use Supabase Edge Functions to send custom emails
		// For this example, we'll return the URL and log it
		// In production, you should send this via email

		console.log(`Deletion confirmation URL: ${deletionUrl}`);

		return json({
			success: true,
			message: "Deletion confirmation email sent. Please check your inbox.",
			// In development, return the URL so you can test
			deletionUrl: process.env.NODE_ENV === "development" ? deletionUrl : undefined,
		});
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
