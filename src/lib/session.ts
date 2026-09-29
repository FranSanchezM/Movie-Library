import type { Profile } from "@/types";
import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { type UserClient, createUserClient } from "./supabase-server";

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
	return typeof value === "string" && UUID_RE.test(value);
}

export const SESSION_EXPIRED = "Tu sesión expiró. Iniciá sesión de nuevo.";

/** The authenticated Supabase user (token validated with the Auth server). */
export const getCurrentUser = cache(async (): Promise<User | null> => {
	const supabase = await createUserClient();
	const { data } = await supabase.auth.getUser();
	return data.user ?? null;
});

/** The signed-in user's profile (one per user), or null. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
	const user = await getCurrentUser();
	if (!user) return null;

	const supabase = await createUserClient();
	const { data } = await supabase
		.from("profiles")
		.select("*")
		.eq("user_id", user.id)
		.maybeSingle();

	return (data as Profile | null) ?? null;
});

/**
 * For server actions and route handlers: the user-scoped client and the
 * profile derived from the session. Throws when there is no session/profile.
 */
export async function requireProfile(): Promise<{
	supabase: UserClient;
	profile: Profile;
}> {
	const profile = await getCurrentProfile();
	if (!profile) throw new Error(SESSION_EXPIRED);
	return { supabase: await createUserClient(), profile };
}
