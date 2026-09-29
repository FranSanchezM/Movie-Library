import type { Profile } from "@/types";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { normalizeEmail } from "./profile-validation";

function displayName(user: User): string {
	const meta = user.user_metadata ?? {};
	const raw =
		(typeof meta.full_name === "string" && meta.full_name) ||
		(typeof meta.name === "string" && meta.name) ||
		user.email?.split("@")[0] ||
		"Perfil";
	const name = raw.trim().slice(0, 80);
	// profiles.name must have 2..80 chars
	return name.length >= 2 ? name : `${name || "Perfil"}_`.slice(0, 80);
}

/**
 * Returns the user's profile, creating a base one on first login.
 * Order: existing profile -> claim a legacy profile with the same verified
 * email -> create defaults (es, AR, Saturday, emails on). No media
 * preferences are created: each section is set up from its own page.
 * `supabase` must be the user-scoped client (RLS applies).
 */
export async function ensureProfile(
	supabase: SupabaseClient,
	user: User,
): Promise<Profile | null> {
	const select = () =>
		supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();

	const { data: existing } = await select();
	if (existing) return existing as Profile;

	// No-op unless an unclaimed legacy profile matches the verified email.
	const { error: claimError } = await supabase.rpc("claim_legacy_profile");
	if (claimError) console.error("Error claiming legacy profile:", claimError);

	const { data: claimed } = await select();
	if (claimed) return claimed as Profile;

	if (!user.email) return null;

	const { data: created, error } = await supabase
		.from("profiles")
		.insert({
			user_id: user.id,
			name: displayName(user),
			email: normalizeEmail(user.email),
			language: "es",
			country: "AR",
			day_of_week: 6,
			receives_emails: true,
		})
		.select("*")
		.single();

	if (error) {
		// 23505: created concurrently (unique user_id) -> read it back
		if (error.code === "23505") {
			const { data } = await select();
			return (data as Profile | null) ?? null;
		}
		console.error("Error creating profile:", error);
		return null;
	}

	return created as Profile;
}
