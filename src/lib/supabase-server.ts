import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client bound to the signed-in user's session (anon key + user JWT).
 * Row Level Security applies. Use this for everything user-facing; the
 * service-role client in ./supabase is for cron/Inngest only.
 */
export async function createUserClient() {
	const cookieStore = await cookies();

	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					try {
						for (const { name, value, options } of cookiesToSet) {
							cookieStore.set(name, value, options);
						}
					} catch {
						// Called from a Server Component: the proxy refreshes the session.
					}
				},
			},
		},
	);
}

export type UserClient = Awaited<ReturnType<typeof createUserClient>>;
