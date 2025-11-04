import { createSupabaseServerClient } from "$lib/server/supabase";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	// Create Supabase client for this request
	event.locals.supabase = createSupabaseServerClient(event.cookies);

	// Get the current session
	const {
		data: { session },
	} = await event.locals.supabase.auth.getSession();

	// If there's a session, fetch the user profile
	if (session?.user) {
		const { data: profile } = await event.locals.supabase
			.from("profiles")
			.select("username")
			.eq("id", session.user.id)
			.single();

		event.locals.session = session;
		event.locals.user = {
			id: session.user.id,
			email: session.user.email!,
			username: profile?.username || null,
		};
	} else {
		event.locals.session = null;
		event.locals.user = null;
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			// Ensure supabase cookies are sent to the client
			return name === "content-range" || name === "x-supabase-api-version";
		},
	});
};
