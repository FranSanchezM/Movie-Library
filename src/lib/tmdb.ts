const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY!;

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

// Fetch a random movie from TMDB based on user filters
export async function fetchRandomMovie(
	genres: number[],
	yearFrom: number,
	yearTo: number,
	excludeTmdbIds: number[] = [],
): Promise<TMDBMovie | null> {
	// Get a random page between 1 and 5 for variety
	const randomPage = Math.floor(Math.random() * 5) + 1;

	const params = new URLSearchParams({
		api_key: TMDB_API_KEY,
		with_genres: genres.join("|"),
		"primary_release_date.gte": `${yearFrom}-01-01`,
		"primary_release_date.lte": `${yearTo}-12-31`,
		sort_by: "vote_count.desc",
		"vote_count.gte": "100", // only movies with enough votes
		page: String(randomPage),
	});

	const res = await fetch(`${TMDB_BASE}/discover/movie?${params}`, {
		next: { revalidate: 3600 },
	});

	if (!res.ok) {
		console.error("TMDB discover error:", await res.text());
		return null;
	}

	const data = await res.json();
	const movies: TMDBMovie[] = data.results ?? [];

	// Filter out already recommended movies
	const available = movies.filter((m) => !excludeTmdbIds.includes(m.id));

	if (available.length === 0) return null;

	// Pick a random one from the results
	return available[Math.floor(Math.random() * available.length)];
}

// Fetch full movie detail to get imdb_id
export async function fetchMovieDetail(
	tmdbId: number,
): Promise<TMDBMovieDetail | null> {
	const res = await fetch(
		`${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`,
		{ next: { revalidate: 86400 } },
	);

	if (!res.ok) return null;
	return res.json();
}

// Fetch description from Wikipedia, fallback to TMDB overview
export async function fetchDescription(
	title: string,
	tmdbOverview: string,
): Promise<string> {
	try {
		const encoded = encodeURIComponent(title.replace(/ /g, "_"));
		const res = await fetch(
			`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
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

// Build Letterboxd slug from title using the slugify package logic
export function buildLetterboxdUrls(title: string): {
	main: string;
	fallback: string;
} {
	const slug = title
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-");

	return {
		main: `https://letterboxd.com/film/${slug}/`,
		fallback: `https://letterboxd.com/search/${encodeURIComponent(title)}/`,
	};
}
