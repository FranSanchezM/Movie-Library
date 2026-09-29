"use server";

import { normalizeEmail, parseProfileInput } from "@/lib/profile-validation";
import {
	SESSION_EXPIRED,
	getCurrentProfile,
	getCurrentUser,
} from "@/lib/session";
import { createUserClient } from "@/lib/supabase-server";

const ALREADY_HAS_PROFILE = "Ya tenés un perfil";

/** Creates the signed-in user's (single) profile. */
export async function createProfileAction(input: unknown) {
	const user = await getCurrentUser();
	if (!user?.email) throw new Error(SESSION_EXPIRED);

	if (await getCurrentProfile()) throw new Error(ALREADY_HAS_PROFILE);

	const data = parseProfileInput(input);
	const supabase = await createUserClient();

	// user_id is unique in the database, so concurrent calls cannot create two.
	const { data: profile, error } = await supabase
		.from("profiles")
		.insert({ ...data, email: normalizeEmail(user.email), user_id: user.id })
		.select("id")
		.single();

	if (error?.code === "23505") throw new Error(ALREADY_HAS_PROFILE);
	if (error || !profile) {
		console.error("Error creating profile:", error);
		throw new Error("No se pudo crear el perfil");
	}

	return { id: profile.id as string };
}
