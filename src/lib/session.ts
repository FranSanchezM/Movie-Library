import type { Profile, ProfilePreferences } from "@/types";
import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { ensureProfile } from "./profile-bootstrap";
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

/**
 * The signed-in user's profile (one per user), or null without a session.
 * Normally created by the auth callback; ensureProfile is a safety net.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
	const user = await getCurrentUser();
	if (!user) return null;

	const supabase = await createUserClient();
	const { data } = await supabase
		.from("profiles")
		.select("*")
		.eq("user_id", user.id)
		.maybeSingle();

	if (data) return data as Profile;
	return ensureProfile(supabase, user);
});

/** Preference rows of the signed-in profile (one per media type at most). */
export const getCurrentPreferences = cache(
	async (): Promise<ProfilePreferences[]> => {
		const profile = await getCurrentProfile();
		if (!profile) return [];

		const supabase = await createUserClient();
		const { data } = await supabase
			.from("profile_preferences")
			.select("*")
			.eq("profile_id", profile.id);

		return (data ?? []) as ProfilePreferences[];
	},
);

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
