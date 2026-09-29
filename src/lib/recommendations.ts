import type { MediaType } from "@/config/media";
import type {
	Library,
	Profile,
	ProfilePreferences,
	Recommendation,
} from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendMediaEmail } from "./email";
import { type EnrichedMedia, getMediaProvider } from "./media";
import { getCurrentYear } from "./profile-options";

// Works with the user-scoped client (RLS) and with the service-role client (cron).
type Supabase = SupabaseClient;

/** Get or create the profile's library for a calendar year. */
export async function getOrCreateLibrary(
	supabase: Supabase,
	profileId: string,
	year: number,
): Promise<Library> {
	const { data, error } = await supabase
		.from("libraries")
		.upsert({ profile_id: profileId, year }, { onConflict: "profile_id,year" })
		.select()
		.single();

	if (error || !data) {
		throw new Error(`Could not get or create library: ${error?.message}`);
	}
	return data as Library;
}

export type CreateRecommendationResult =
	| { ok: true; recommendation: Recommendation }
	| {
			ok: false;
			reason:
				| "profile_not_found"
				| "media_disabled"
				| "no_media"
				| "save_failed";
	  };

/**
 * Picks a title of the given media type for the profile, stores it in the
 * current year's library (created on demand) and emails it when the profile
 * opted in.
 */
export async function createRecommendationForProfile(
	supabase: Supabase,
	profileId: string,
	mediaType: MediaType,
): Promise<CreateRecommendationResult> {
	const { data: profile } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", profileId)
		.maybeSingle<Profile>();

	if (!profile) return { ok: false, reason: "profile_not_found" };

	const { data: prefs } = await supabase
		.from("profile_preferences")
		.select("*")
		.eq("profile_id", profile.id)
		.eq("media_type", mediaType)
		.maybeSingle<ProfilePreferences>();

	if (!prefs?.enabled) return { ok: false, reason: "media_disabled" };

	// Dedupe by tmdb_id across every yearly library of the profile (per media type)
	const { data: existing } = await supabase
		.from("recommendations")
		.select("tmdb_id")
		.eq("profile_id", profile.id)
		.eq("media_type", mediaType);

	const excludeIds = (existing ?? []).map(
		(r: { tmdb_id: number }) => r.tmdb_id,
	);

	const library = await getOrCreateLibrary(
		supabase,
		profile.id,
		getCurrentYear(),
	);

	// unique(profile_id, media_type, tmdb_id) guards against races: on a duplicate
	// (23505) exclude that title and pick another one.
	const MAX_PICKS = 3;
	let media: EnrichedMedia | null = null;
	let saved: Recommendation | null = null;

	for (let attempt = 0; attempt < MAX_PICKS && !saved; attempt++) {
		media = await getMediaProvider(mediaType).pick(
			{
				genres: prefs.genres,
				yearFrom: prefs.year_from,
				yearTo: prefs.year_to,
				providerIds: prefs.provider_ids,
				country: profile.country,
				language: profile.language,
			},
			excludeIds,
		);
		if (!media) return { ok: false, reason: "no_media" };

		const { data, error } = await supabase
			.from("recommendations")
			.insert({
				profile_id: profile.id,
				library_id: library.id,
				media_type: mediaType,
				tmdb_id: media.tmdbId,
				imdb_id: media.imdbId,
				title: media.title,
				slug: media.primaryUrl,
				poster_path: media.posterUrl,
				description: media.description,
				release_year: media.releaseYear,
				tmdb_rating: media.tmdbRating,
				imdb_rating: media.imdbRating,
				rt_rating: media.rtRating,
				seasons: media.seasons,
			})
			.select()
			.single();

		if (error?.code === "23505") {
			excludeIds.push(media.tmdbId);
			continue;
		}
		if (error || !data) {
			console.error("Error saving recommendation:", error);
			return { ok: false, reason: "save_failed" };
		}
		saved = data as Recommendation;
	}

	if (!saved || !media) return { ok: false, reason: "no_media" };

	if (profile.receives_emails !== false) {
		await sendMediaEmail(profile, media);
	}

	return { ok: true, recommendation: saved };
}
