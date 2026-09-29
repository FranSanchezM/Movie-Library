import type { MediaType } from "@/config/media";
import type { Language } from "@/types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY!;

const TMDB_LANGUAGE: Record<Language, string> = {
	es: "es-ES",
	en: "en-US",
};

/** TMDB kinds are the media types backed by TMDB. */
export type TmdbKind = Extract<MediaType, "movie" | "tv">;

/** Normalized discover result (movies: title/release_date, series: name/first_air_date). */
export interface TmdbItem {
	id: number;
	title: string;
	overview: string;
	poster_path: string | null;
	date: string;
	vote_average: number;
}

export interface TmdbDetail {
	imdbId: string | null;
	/** Series only */
	seasons: number | null;
}

export interface WatchProvider {
	id: number;
	name: string;
	logoPath: string | null;
}

export interface TmdbFilters {
	genres: number[];
	yearFrom: number;
	yearTo: number;
	/** TMDB watch provider ids. Empty = no availability filter. */
	providerIds: number[];
	/** ISO 3166-1 alpha-2, used as watch_region. */
	country: string;
	language: Language;
}

// Discover date filter per kind
const DATE_PARAM: Record<TmdbKind, string> = {
	movie: "primary_release_date",
	tv: "first_air_date",
};

async function discoverPage(
	kind: TmdbKind,
	filters: TmdbFilters,
	page: number,
): Promise<{ items: TmdbItem[]; totalPages: number } | null> {
	const params = new URLSearchParams({
		api_key: TMDB_API_KEY,
		language: TMDB_LANGUAGE[filters.language],
		with_genres: filters.genres.join("|"),
		[`${DATE_PARAM[kind]}.gte`]: `${filters.yearFrom}-01-01`,
		[`${DATE_PARAM[kind]}.lte`]: `${filters.yearTo}-12-31`,
		sort_by: "vote_count.desc",
		"vote_count.gte": "100", // only titles with enough votes
		page: String(page),
	});

	if (filters.providerIds.length > 0) {
		params.set("with_watch_providers", filters.providerIds.join("|"));
		params.set("watch_region", filters.country);
		params.set("with_watch_monetization_types", "flatrate");
	}

	const res = await fetch(`${TMDB_BASE}/discover/${kind}?${params}`, {
		next: { revalidate: 3600 },
	});

	if (!res.ok) {
		console.error("TMDB discover error:", await res.text());
		return null;
	}

	const data = await res.json();
	const items: TmdbItem[] = (data.results ?? []).map(
		(r: Record<string, unknown>) => ({
			id: r.id as number,
			title: (r.title ?? r.name ?? "") as string,
			overview: (r.overview ?? "") as string,
			poster_path: (r.poster_path ?? null) as string | null,
			date: (r.release_date ?? r.first_air_date ?? "") as string,
			vote_average: (r.vote_average ?? 0) as number,
		}),
	);
	return { items, totalPages: data.total_pages ?? 1 };
}

// TMDB discover serves at most 500 pages
const MAX_DISCOVER_PAGE = 500;
const MAX_PAGE_ATTEMPTS = 6;

// Fetch a random title of the given kind from TMDB based on the preferences
export async function fetchRandomItem(
	kind: TmdbKind,
	filters: TmdbFilters,
	excludeTmdbIds: number[] = [],
): Promise<TmdbItem | null> {
	const exclude = new Set(excludeTmdbIds);

	// Page 1 tells us how many pages the filters produce
	const first = await discoverPage(kind, filters, 1);
	if (!first) return null;

	const maxPage = Math.min(Math.max(first.totalPages, 1), MAX_DISCOVER_PAGE);
	const pick = (items: TmdbItem[]) => {
		const available = items.filter((m) => !exclude.has(m.id));
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
			const item = pick(first.items);
			if (item) return item;
			continue;
		}

		const result = await discoverPage(kind, filters, page);
		if (!result) return null;
		const item = pick(result.items);
		if (item) return item;
	}

	// Last resort: the first page (already fetched) if not tried
	return tried.has(1) ? null : pick(first.items);
}

// Full detail: IMDb id (external_ids for series) and season count
export async function fetchDetail(
	kind: TmdbKind,
	tmdbId: number,
	language: Language,
): Promise<TmdbDetail | null> {
	const params = new URLSearchParams({
		api_key: TMDB_API_KEY,
		language: TMDB_LANGUAGE[language],
	});
	if (kind === "tv") params.set("append_to_response", "external_ids");

	const res = await fetch(`${TMDB_BASE}/${kind}/${tmdbId}?${params}`, {
		next: { revalidate: 86400 },
	});
	if (!res.ok) return null;

	const data = await res.json();
	return {
		imdbId: (kind === "tv" ? data.external_ids?.imdb_id : data.imdb_id) || null,
		seasons: kind === "tv" ? (data.number_of_seasons ?? null) : null,
	};
}

// Streaming providers available in a country, most relevant first
export async function fetchWatchProviders(
	kind: TmdbKind,
	country: string,
	language: Language,
): Promise<WatchProvider[]> {
	const params = new URLSearchParams({
		api_key: TMDB_API_KEY,
		watch_region: country,
		language: TMDB_LANGUAGE[language],
	});

	try {
		const res = await fetch(`${TMDB_BASE}/watch/providers/${kind}?${params}`, {
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
			// Skip disambiguation pages
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

export function buildTmdbUrl(kind: TmdbKind, tmdbId: number): string {
	return `https://www.themoviedb.org/${kind}/${tmdbId}`;
}
