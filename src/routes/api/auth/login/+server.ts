import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { email, password } = await request.json();

		// Validation
		if (!email || !password) {
			return json(
				{ success: false, error: "Email and password are required" },
				{ status: 400 },
			);
		}

		// Sign in with Supabase
		const { data, error } = await locals.supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			console.error("Supabase login error:", error);
			return json(
				{ success: false, error: "Invalid email or password" },
				{ status: 401 },
			);
		}

		if (!data.user) {
			return json({ success: false, error: "Login failed" }, { status: 500 });
		}

		// Fetch user profile
		const { data: profile } = await locals.supabase
			.from("profiles")
			.select("username")
			.eq("id", data.user.id)
			.single();

		return json({
			success: true,
			user: {
				id: data.user.id,
				email: data.user.email,
				username: profile?.username || null,
			},
		});
	} catch (err) {
		console.error("Login error:", err);
		return json(
			{ success: false, error: "An unexpected error occurred" },
			{ status: 500 },
		);
	}
};
