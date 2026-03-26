import { fetchRatings } from "./omdb";
import {
	type EnrichedMovie,
	buildLetterboxdUrls,
	fetchDescription,
	fetchMovieDetail,
	fetchRandomMovie,
} from "./tmdb";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

export async function getMovieForLibrary(
	genres: number[],
	yearFrom: number,
	yearTo: number,
	excludeTmdbIds: number[] = [],
): Promise<EnrichedMovie | null> {
	// 1. Get a random movie from TMDB matching filters
	const movie = await fetchRandomMovie(
		genres,
		yearFrom,
		yearTo,
		excludeTmdbIds,
	);
	if (!movie) return null;

	// 2. Fetch full detail to get imdb_id
	const detail = await fetchMovieDetail(movie.id);
	const imdbId = detail?.imdb_id ?? null;

	// 3. Fetch OMDb ratings if we have an IMDB id
	const ratings = imdbId
		? await fetchRatings(imdbId)
		: { imdbRating: null, rtRating: null };

	// 4. Fetch Wikipedia description, fallback to TMDB overview
	const description = await fetchDescription(movie.title, movie.overview);

	// 5. Build Letterboxd URLs
	const { main: letterboxdUrl, fallback: letterboxdFallbackUrl } =
		buildLetterboxdUrls(movie.title);

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
