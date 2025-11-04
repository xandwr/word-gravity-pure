import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	// Protect this route - redirect to login if not authenticated
	if (!locals.user) {
		throw redirect(302, "/login");
	}

	return {
		user: locals.user,
	};
};
