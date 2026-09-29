"use server";

import { isMediaType } from "@/config/media";
import { getMediaProvider } from "@/lib/media";
import {
	isValidCountry,
	isValidLanguage,
	parsePreferences,
	parseSettingsInput,
} from "@/lib/profile-validation";
import { getCurrentUser, requireProfile } from "@/lib/session";
import type { WatchProvider } from "@/lib/tmdb";
import { revalidatePath } from "next/cache";

/** Updates the signed-in user's profile and media preferences (validated server-side). */
export async function updateProfileAction(input: unknown) {
	const { supabase, profile } = await requireProfile();
	const { profile: profileData, preferences } = parseSettingsInput(input);

	const { error } = await supabase
		.from("profiles")
		.update(profileData)
		.eq("id", profile.id);

	if (error) {
		console.error("Error updating profile:", error);
		throw new Error("No se pudo guardar la configuración");
	}

	const { error: prefsError } = await supabase
		.from("profile_preferences")
		.upsert(
			preferences.map((p) => ({
				...p,
				profile_id: profile.id,
				updated_at: new Date().toISOString(),
			})),
			{ onConflict: "profile_id,media_type" },
		);

	if (prefsError) {
		console.error("Error updating preferences:", prefsError);
		throw new Error("No se pudo guardar la configuración");
	}

	revalidatePath("/", "layout");
	revalidatePath("/settings");
}

/**
 * Creates (or updates) and enables the library of one media type from its
 * section page. Genres, years and providers are validated server-side.
 */
export async function saveMediaPreferencesAction(input: unknown) {
	const { supabase, profile } = await requireProfile();

	if (typeof input !== "object" || input === null) {
		throw new Error("Datos inválidos");
	}
	const prefs = parsePreferences({
		...(input as Record<string, unknown>),
		enabled: true,
	});

	const { error } = await supabase
		.from("profile_preferences")
		.upsert(
			{
				...prefs,
				profile_id: profile.id,
				updated_at: new Date().toISOString(),
			},
			{ onConflict: "profile_id,media_type" },
		);

	if (error) {
		console.error("Error saving media preferences:", error);
		throw new Error("No se pudo crear la biblioteca");
	}

	revalidatePath("/", "layout");
}

export async function setReceivesEmailsAction(receivesEmails: boolean) {
	const { supabase, profile } = await requireProfile();

	const { error } = await supabase
		.from("profiles")
		.update({ receives_emails: receivesEmails === true })
		.eq("id", profile.id);

	if (error) {
		console.error("Error updating profile:", error);
		throw new Error("No se pudo actualizar la configuración");
	}

	revalidatePath("/", "layout");
}

/** Streaming providers available in a country for a media type. */
export async function getWatchProvidersAction(
	mediaType: string,
	country: string,
	language: string,
): Promise<WatchProvider[]> {
	if (!isMediaType(mediaType)) return [];
	if (!isValidCountry(country) || !isValidLanguage(language)) return [];
	if (!(await getCurrentUser())) return [];
	return getMediaProvider(mediaType).listWatchProviders(country, language);
}
