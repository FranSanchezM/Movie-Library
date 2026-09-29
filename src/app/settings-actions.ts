"use server";

import {
	isValidCountry,
	isValidLanguage,
	parseProfileInput,
} from "@/lib/profile-validation";
import { getCurrentUser, requireProfile } from "@/lib/session";
import { type WatchProvider, fetchWatchProviders } from "@/lib/tmdb";
import { revalidatePath } from "next/cache";

/** Updates the signed-in user's profile (validated server-side). */
export async function updateProfileAction(input: unknown) {
	const { supabase, profile } = await requireProfile();
	const data = parseProfileInput(input);

	const { error } = await supabase
		.from("profiles")
		.update(data)
		.eq("id", profile.id);

	if (error) {
		console.error("Error updating profile:", error);
		throw new Error("No se pudo guardar la configuración");
	}

	revalidatePath("/");
	revalidatePath("/settings");
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

	revalidatePath("/");
}

/** Streaming providers available in a country (TMDB watch providers). */
export async function getWatchProvidersAction(
	country: string,
	language: string,
): Promise<WatchProvider[]> {
	if (!isValidCountry(country) || !isValidLanguage(language)) return [];
	if (!(await getCurrentUser())) return [];
	return fetchWatchProviders(country, language);
}
