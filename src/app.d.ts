// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Session, SupabaseClient } from "@supabase/supabase-js";

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			session: Session | null;
			user: {
				id: string;
				email: string;
				username: string | null;
			} | null;
		}
		interface PageData {
			session: Session | null;
			user: {
				id: string;
				email: string;
				username: string | null;
			} | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
