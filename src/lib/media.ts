import { type MediaType, getMediaConfig } from "@/config/media";
import type { Language } from "@/types";
import { fetchRatings } from "./omdb";
import {
	coverUrl,
	fetchWorkDescription,
	pickBook,
	workId,
	workUrl,
} from "./openlibrary";
import {
	type TmdbKind,
	type WatchProvider,
	buildLetterboxdUrls,
	buildTmdbUrl,
	fetchDescription,
	fetchDetail,
	fetchRandomItem,
	fetchWatchProviders,
} from "./tmdb";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

/** A recommendation candidate, normalized across media types. */
export interface EnrichedMedia {
	mediaType: MediaType;
	/** Id in the source catalog (unique per media type, not across types) */
	externalId: string;
	/** TMDB id (TMDB-backed types only) */
	tmdbId: number | null;
	/** Author(s) (books) */
	creator: string | null;
	imdbId: string | null;
	title: string;
	posterUrl: string | null;
	description: string;
	releaseYear: number;
	tmdbRating: number | null;
	imdbRating: string | null;
	rtRating: string | null;
	/** Generic source rating out of 5 and its vote count (books) */
	rating: number | null;
	ratingCount: number | null;
	/** Page count (books) */
	pages: number | null;
	imdbUrl: string | null;
	/** Main external link (Letterboxd for movies, TMDB for series, Open Library for books) */
	primaryUrl: string;
	/** Series only */
	seasons: number | null;
}

export interface MediaFilters {
	genres: number[];
	yearFrom: number;
	yearTo: number;
	/** Watch provider ids. Empty = no availability filter. */
	providerIds: number[];
	/** ISO 3166-1 alpha-2, used as watch region. */
	country: string;
	language: Language;
	/** Media-specific options (profile_preferences.options), already validated */
	options: Record<string, string | number>;
}

/** Hooks a media type plugs into. */
export interface MediaProvider {
	id: MediaType;
	/** `excludeIds` are external ids already recommended to the profile */
	pick(
		filters: MediaFilters,
		excludeIds: string[],
	): Promise<EnrichedMedia | null>;
	/** Only for types filtered by streaming platform */
	listWatchProviders?(
		country: string,
		language: Language,
	): Promise<WatchProvider[]>;
}

function tmdbProvider(kind: TmdbKind): MediaProvider {
	return {
		id: kind,

		async pick(filters, excludeIds) {
			const { language } = filters;

			// 1. Random title matching the filters (localized title/overview)
			const item = await fetchRandomItem(kind, filters, excludeIds.map(Number));
			if (!item) return null;

			// 2. Detail: IMDb id (+ seasons for series)
			const detail = await fetchDetail(kind, item.id, language);
			const imdbId = detail?.imdbId ?? null;

			// 3. OMDb ratings (works for series by IMDb id too)
			const ratings = imdbId
				? await fetchRatings(imdbId)
				: { imdbRating: null, rtRating: null };

			// 4. Wikipedia description (es/en), fallback to TMDB overview
			const description = await fetchDescription(
				item.title,
				item.overview,
				language,
			);

			// 5. Main link: Letterboxd only applies to movies
			const primaryUrl =
				kind === "movie"
					? buildLetterboxdUrls(item.id, item.title).main
					: buildTmdbUrl(kind, item.id);

			return {
				mediaType: kind,
				externalId: String(item.id),
				tmdbId: item.id,
				creator: null,
				imdbId,
				title: item.title,
				posterUrl: item.poster_path
					? `${TMDB_IMAGE_BASE}${item.poster_path}`
					: null,
				description,
				releaseYear: item.date ? Number.parseInt(item.date.slice(0, 4)) : 0,
				tmdbRating: Math.round(item.vote_average * 10) / 10,
				imdbRating: ratings.imdbRating,
				rtRating: ratings.rtRating,
				rating: null,
				ratingCount: null,
				pages: null,
				imdbUrl: imdbId ? `https://www.imdb.com/title/${imdbId}/` : null,
				primaryUrl,
				seasons: detail?.seasons ?? null,
			};
		},

		listWatchProviders(country, language) {
			return fetchWatchProviders(kind, country, language);
		},
	};
}

function isChoice(value: unknown, allowed: readonly string[]): string {
	return typeof value === "string" && allowed.includes(value) ? value : "any";
}

const bookProvider: MediaProvider = {
	id: "book",

	async pick(filters, excludeIds) {
		const config = getMediaConfig("book");
		const genres = config.genres.filter((g) => filters.genres.includes(g.id));
		const rating = Number(filters.options.min_rating);

		const doc = await pickBook(
			{
				genres,
				yearFrom: filters.yearFrom,
				yearTo: filters.yearTo,
				length: isChoice(filters.options.length, ["short", "medium", "long"]),
				language: isChoice(filters.options.language, ["es", "en"]),
				minRating: Number.isFinite(rating) ? rating : 3.5,
			},
			excludeIds,
		);
		if (!doc) return null;

		// Single works lookup; no description is fine (Open Library has no Spanish)
		const id = workId(doc.key);
		const description = (await fetchWorkDescription(id)) ?? "";

		return {
			mediaType: "book",
			externalId: id,
			tmdbId: null,
			creator: doc.author_name?.slice(0, 3).join(", ") || null,
			imdbId: null,
			title: doc.title,
			posterUrl: coverUrl(doc.cover_i),
			description,
			releaseYear: doc.first_publish_year ?? 0,
			tmdbRating: null,
			imdbRating: null,
			rtRating: null,
			rating: doc.ratings_average
				? Math.round(doc.ratings_average * 10) / 10
				: null,
			ratingCount: doc.ratings_count ?? null,
			pages: doc.number_of_pages_median ?? null,
			imdbUrl: null,
			primaryUrl: workUrl(id),
			seasons: null,
		};
	},
};

const PROVIDERS: Record<MediaType, MediaProvider> = {
	movie: tmdbProvider("movie"),
	tv: tmdbProvider("tv"),
	book: bookProvider,
};

export function getMediaProvider(type: MediaType): MediaProvider {
	return PROVIDERS[type];
}
