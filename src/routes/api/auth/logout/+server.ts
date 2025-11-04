import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals }) => {
	try {
		const { error } = await locals.supabase.auth.signOut();

		if (error) {
			console.error("Supabase logout error:", error);
			return json({ success: false, error: error.message }, { status: 500 });
		}

		return json({ success: true });
	} catch (err) {
		console.error("Logout error:", err);
		return json(
			{ success: false, error: "An unexpected error occurred" },
			{ status: 500 },
		);
	}
};
