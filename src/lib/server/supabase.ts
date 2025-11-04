import { createServerClient } from "@supabase/ssr";
import type { cookies as cookiesType } from "@sveltejs/kit";
import { SUPABASE_SERVICE_ROLE_KEY } from "$env/static/private";
import {
	VITE_SUPABASE_URL,
	VITE_SUPABASE_ANON_KEY,
} from "$env/static/private";

/**
 * Creates a Supabase client for server-side use with cookie handling
 * This should be used in hooks, server load functions, and API routes
 */
export function createSupabaseServerClient(cookies: typeof cookiesType) {
	return createServerClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, {
		cookies: {
			getAll() {
				return cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) => {
					cookies.set(name, value, { ...options, path: "/" });
				});
			},
		},
	});
}

/**
 * Creates a Supabase admin client with service role key
 * USE WITH CAUTION - This bypasses Row Level Security
 * Only use for admin operations like user management
 */
export function createSupabaseAdminClient() {
	return createServerClient(VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		cookies: {
			getAll() {
				return [];
			},
			setAll() {
				// No-op for admin client
			},
		},
	});
}
