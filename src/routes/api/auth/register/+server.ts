import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getPlayerId } from "$lib/utils/playerIdentity";

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { email, password, username, playerId } = await request.json();

		// Validation
		if (!email || !password || !username) {
			return json(
				{ success: false, error: "Email, password, and username are required" },
				{ status: 400 },
			);
		}

		if (password.length < 6) {
			return json(
				{ success: false, error: "Password must be at least 6 characters" },
				{ status: 400 },
			);
		}

		if (username.length < 3 || username.length > 20) {
			return json(
				{ success: false, error: "Username must be between 3 and 20 characters" },
				{ status: 400 },
			);
		}

		// Check if username is already taken
		const { data: existingProfile } = await locals.supabase
			.from("profiles")
			.select("id")
			.eq("username", username)
			.single();

		if (existingProfile) {
			return json(
				{ success: false, error: "Username is already taken" },
				{ status: 400 },
			);
		}

		// Create the user account
		const { data, error } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					username,
					legacy_player_id: playerId, // Store for potential migration
				},
			},
		});

		if (error) {
			console.error("Supabase signup error:", error);
			return json({ success: false, error: error.message }, { status: 400 });
		}

		if (!data.user) {
			return json(
				{ success: false, error: "Failed to create account" },
				{ status: 500 },
			);
		}

		// Create profile (should be handled by trigger, but we'll do it manually for now)
		const { error: profileError } = await locals.supabase.from("profiles").insert({
			id: data.user.id,
			username: username,
		});

		if (profileError) {
			console.error("Profile creation error:", profileError);
			// Don't fail the registration, just log it
		}

		return json({
			success: true,
			user: {
				id: data.user.id,
				email: data.user.email,
				username,
			},
		});
	} catch (err) {
		console.error("Registration error:", err);
		return json(
			{ success: false, error: "An unexpected error occurred" },
			{ status: 500 },
		);
	}
};
