import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getPlayerId } from "$lib/utils/playerIdentity";
import { createSupabaseAdminClient } from "$lib/server/supabase";

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
		const { data: existingProfileByUsername } = await locals.supabase
			.from("profiles")
			.select("id")
			.eq("username", username)
			.single();

		if (existingProfileByUsername) {
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
				emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
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

		// Check if email confirmation is required
		if (data.session === null) {
			console.log("Email confirmation required for user:", data.user.id);
			// User created but needs to confirm email
			// The trigger should have created the profile already
			return json({
				success: true,
				requiresEmailConfirmation: true,
				message: "Please check your email to confirm your account",
				user: {
					id: data.user.id,
					email: data.user.email,
					username,
				},
			});
		}

		// Create profile using admin client to bypass RLS
		const adminClient = createSupabaseAdminClient();

		// Check if profile already exists (from trigger)
		const { data: adminExistingProfile } = await adminClient
			.from("profiles")
			.select("username")
			.eq("id", data.user.id)
			.maybeSingle();

		if (!adminExistingProfile) {
			// Profile doesn't exist, create it
			const { error: profileInsertError } = await adminClient
				.from("profiles")
				.insert({
					id: data.user.id,
					username: username,
				});

			if (profileInsertError) {
				console.error("Failed to create profile:", profileInsertError);
				return json(
					{
						success: false,
						error: "Account created but profile setup failed. Please try logging in.",
					},
					{ status: 500 },
				);
			}
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
