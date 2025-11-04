import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get("code");
	const next = url.searchParams.get("next") ?? "/";

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			throw redirect(303, next);
		}
	}

	// If there's an error or no code, redirect to login
	throw redirect(303, "/login");
};
