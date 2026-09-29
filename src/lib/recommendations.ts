import type { Library, Profile, Recommendation } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendMovieEmail } from "./email";
import { getMovieForProfile } from "./movies";
import { getCurrentYear } from "./profile-options";
import type { EnrichedMovie } from "./tmdb";

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
	| { ok: false; reason: "profile_not_found" | "no_movie" | "save_failed" };

/**
 * Picks a movie for the profile, stores it in the current year's library
 * (created on demand) and emails it when the profile opted in.
 */
export async function createRecommendationForProfile(
	supabase: Supabase,
	profileId: string,
): Promise<CreateRecommendationResult> {
	const { data: profile } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", profileId)
		.maybeSingle<Profile>();

	if (!profile) return { ok: false, reason: "profile_not_found" };

	// Dedupe by tmdb_id across every yearly library of the profile
	const { data: existing } = await supabase
		.from("recommendations")
		.select("tmdb_id")
		.eq("profile_id", profile.id);

	const excludeIds = (existing ?? []).map(
		(r: { tmdb_id: number }) => r.tmdb_id,
	);

	const library = await getOrCreateLibrary(
		supabase,
		profile.id,
		getCurrentYear(),
	);

	// unique(profile_id, tmdb_id) guards against races: on a duplicate
	// (23505) exclude that movie and pick another one.
	const MAX_PICKS = 3;
	let movie: EnrichedMovie | null = null;
	let saved: Recommendation | null = null;

	for (let attempt = 0; attempt < MAX_PICKS && !saved; attempt++) {
		movie = await getMovieForProfile(profile, excludeIds);
		if (!movie) return { ok: false, reason: "no_movie" };

		const { data, error } = await supabase
			.from("recommendations")
			.insert({
				profile_id: profile.id,
				library_id: library.id,
				tmdb_id: movie.tmdbId,
				imdb_id: movie.imdbId,
				title: movie.title,
				slug: movie.letterboxdUrl,
				poster_path: movie.posterUrl,
				description: movie.description,
				release_year: movie.releaseYear,
				tmdb_rating: movie.tmdbRating,
				imdb_rating: movie.imdbRating,
				rt_rating: movie.rtRating,
			})
			.select()
			.single();

		if (error?.code === "23505") {
			excludeIds.push(movie.tmdbId);
			continue;
		}
		if (error || !data) {
			console.error("Error saving recommendation:", error);
			return { ok: false, reason: "save_failed" };
		}
		saved = data as Recommendation;
	}

	if (!saved || !movie) return { ok: false, reason: "no_movie" };

	if (profile.receives_emails !== false) {
		await sendMovieEmail(profile, movie);
	}

	return { ok: true, recommendation: saved };
}
