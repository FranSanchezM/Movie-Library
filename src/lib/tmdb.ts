import type { Language } from "@/types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY!;

const TMDB_LANGUAGE: Record<Language, string> = {
	es: "es-ES",
	en: "en-US",
};

export interface TMDBMovie {
	id: number;
	title: string;
	overview: string;
	poster_path: string | null;
	release_date: string;
	vote_average: number;
	genre_ids: number[];
}

export interface TMDBMovieDetail extends TMDBMovie {
	imdb_id: string | null;
}

export interface WatchProvider {
	id: number;
	name: string;
	logoPath: string | null;
}

export interface EnrichedMovie {
	tmdbId: number;
	imdbId: string | null;
	title: string;
	slug: string;
	posterUrl: string | null;
	description: string;
	releaseYear: number;
	tmdbRating: number;
	imdbRating: string | null;
	rtRating: string | null;
	imdbUrl: string | null;
	letterboxdUrl: string;
	letterboxdFallbackUrl: string;
}

export interface MovieFilters {
	genres: number[];
	yearFrom: number;
	yearTo: number;
	/** TMDB watch provider ids. Empty = no availability filter. */
	providerIds: number[];
	/** ISO 3166-1 alpha-2, used as watch_region. */
	country: string;
	language: Language;
}

async function discoverPage(
	filters: MovieFilters,
	page: number,
): Promise<{ movies: TMDBMovie[]; totalPages: number } | null> {
	const params = new URLSearchParams({
		api_key: TMDB_API_KEY,
		language: TMDB_LANGUAGE[filters.language],
		with_genres: filters.genres.join("|"),
		"primary_release_date.gte": `${filters.yearFrom}-01-01`,
		"primary_release_date.lte": `${filters.yearTo}-12-31`,
		sort_by: "vote_count.desc",
		"vote_count.gte": "100", // only movies with enough votes
		page: String(page),
	});

	if (filters.providerIds.length > 0) {
		params.set("with_watch_providers", filters.providerIds.join("|"));
		params.set("watch_region", filters.country);
		params.set("with_watch_monetization_types", "flatrate");
	}

	const res = await fetch(`${TMDB_BASE}/discover/movie?${params}`, {
		next: { revalidate: 3600 },
	});

	if (!res.ok) {
		console.error("TMDB discover error:", await res.text());
		return null;
	}

	const data = await res.json();
	return {
		movies: data.results ?? [],
		totalPages: data.total_pages ?? 1,
	};
}

// TMDB discover serves at most 500 pages
const MAX_DISCOVER_PAGE = 500;
const MAX_PAGE_ATTEMPTS = 6;

// Fetch a random movie from TMDB based on the profile preferences
export async function fetchRandomMovie(
	filters: MovieFilters,
	excludeTmdbIds: number[] = [],
): Promise<TMDBMovie | null> {
	const exclude = new Set(excludeTmdbIds);

	// Page 1 tells us how many pages the filters produce
	const first = await discoverPage(filters, 1);
	if (!first) return null;

	const maxPage = Math.min(Math.max(first.totalPages, 1), MAX_DISCOVER_PAGE);
	const pick = (movies: TMDBMovie[]) => {
		const available = movies.filter((m) => !exclude.has(m.id));
		return available.length > 0
			? available[Math.floor(Math.random() * available.length)]
			: null;
	};

	// Random pages (distinct); fall back to others when fully excluded
	const tried = new Set<number>();
	const attempts = Math.min(maxPage, MAX_PAGE_ATTEMPTS);
	while (tried.size < attempts) {
		const page = Math.floor(Math.random() * maxPage) + 1;
		if (tried.has(page)) continue;
		tried.add(page);

		if (page === 1) {
			const movie = pick(first.movies);
			if (movie) return movie;
			continue;
		}

		const result = await discoverPage(filters, page);
		if (!result) return null;
		const movie = pick(result.movies);
		if (movie) return movie;
	}

	// Last resort: the first page (already fetched) if not tried
	return tried.has(1) ? null : pick(first.movies);
}

// Fetch full movie detail to get imdb_id
export async function fetchMovieDetail(
	tmdbId: number,
	language: Language,
): Promise<TMDBMovieDetail | null> {
	const params = new URLSearchParams({
		api_key: TMDB_API_KEY,
		language: TMDB_LANGUAGE[language],
	});
	const res = await fetch(`${TMDB_BASE}/movie/${tmdbId}?${params}`, {
		next: { revalidate: 86400 },
	});

	if (!res.ok) return null;
	return res.json();
}

// Streaming providers available in a country, most relevant first
export async function fetchWatchProviders(
	country: string,
	language: Language,
): Promise<WatchProvider[]> {
	const params = new URLSearchParams({
		api_key: TMDB_API_KEY,
		watch_region: country,
		language: TMDB_LANGUAGE[language],
	});

	try {
		const res = await fetch(`${TMDB_BASE}/watch/providers/movie?${params}`, {
			next: { revalidate: 86400 },
		});
		if (!res.ok) return [];

		const data = await res.json();
		const results: {
			provider_id: number;
			provider_name: string;
			logo_path: string | null;
			display_priority?: number;
			display_priorities?: Record<string, number>;
		}[] = data.results ?? [];

		const priority = (p: (typeof results)[number]) =>
			p.display_priorities?.[country] ?? p.display_priority ?? 999;

		return results
			.sort((a, b) => priority(a) - priority(b))
			.map((p) => ({
				id: p.provider_id,
				name: p.provider_name,
				logoPath: p.logo_path,
			}));
	} catch (error) {
		console.error("TMDB watch providers error:", error);
		return [];
	}
}

// Fetch description from Wikipedia (in the profile language), fallback to TMDB overview
export async function fetchDescription(
	title: string,
	tmdbOverview: string,
	language: Language,
): Promise<string> {
	try {
		const encoded = encodeURIComponent(title.replace(/ /g, "_"));
		const res = await fetch(
			`https://${language}.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
			{ next: { revalidate: 86400 } },
		);

		if (res.ok) {
			const data = await res.json();
			// Make sure it's actually a film article
			if (data.extract && data.type !== "disambiguation") {
				return data.extract;
			}
		}
	} catch {
		// silently fallback
	}

	return tmdbOverview;
}

// Letterboxd resolves /tmdb/{id} to the film page regardless of the title
// language, so the localized title is not used to build the slug.
export function buildLetterboxdUrls(
	tmdbId: number,
	title: string,
): {
	main: string;
	fallback: string;
} {
	return {
		main: `https://letterboxd.com/tmdb/${tmdbId}/`,
		fallback: `https://letterboxd.com/search/${encodeURIComponent(title)}/`,
	};
}
