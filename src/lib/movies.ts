import type { Profile } from "@/types";
import { fetchRatings } from "./omdb";
import {
	type EnrichedMovie,
	buildLetterboxdUrls,
	fetchDescription,
	fetchMovieDetail,
	fetchRandomMovie,
} from "./tmdb";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

type PreferenceFields = Pick<
	Profile,
	"genres" | "year_from" | "year_to" | "provider_ids" | "country" | "language"
>;

export async function getMovieForProfile(
	profile: PreferenceFields,
	excludeTmdbIds: number[] = [],
): Promise<EnrichedMovie | null> {
	const { language } = profile;

	// 1. Get a random movie from TMDB matching filters (localized title/overview)
	const movie = await fetchRandomMovie(
		{
			genres: profile.genres,
			yearFrom: profile.year_from,
			yearTo: profile.year_to,
			providerIds: profile.provider_ids,
			country: profile.country,
			language,
		},
		excludeTmdbIds,
	);
	if (!movie) return null;

	// 2. Fetch full detail to get imdb_id
	const detail = await fetchMovieDetail(movie.id, language);
	const imdbId = detail?.imdb_id ?? null;

	// 3. Fetch OMDb ratings if we have an IMDB id
	const ratings = imdbId
		? await fetchRatings(imdbId)
		: { imdbRating: null, rtRating: null };

	// 4. Fetch Wikipedia description (es/en), fallback to TMDB overview
	const description = await fetchDescription(
		movie.title,
		movie.overview,
		language,
	);

	// 5. Build Letterboxd URLs
	const { main: letterboxdUrl, fallback: letterboxdFallbackUrl } =
		buildLetterboxdUrls(movie.id, movie.title);

	const releaseYear = movie.release_date
		? Number.parseInt(movie.release_date.slice(0, 4))
		: 0;

	return {
		tmdbId: movie.id,
		imdbId,
		title: movie.title,
		slug: letterboxdUrl,
		posterUrl: movie.poster_path
			? `${TMDB_IMAGE_BASE}${movie.poster_path}`
			: null,
		description,
		releaseYear,
		tmdbRating: Math.round(movie.vote_average * 10) / 10,
		imdbRating: ratings.imdbRating,
		rtRating: ratings.rtRating,
		imdbUrl: imdbId ? `https://www.imdb.com/title/${imdbId}/` : null,
		letterboxdUrl,
		letterboxdFallbackUrl,
	};
}
