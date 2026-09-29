import type { MediaType } from "@/config/media";
import type { Language } from "@/types";
import { fetchRatings } from "./omdb";
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
	/** TMDB id (unique per media type, not across types) */
	tmdbId: number;
	imdbId: string | null;
	title: string;
	posterUrl: string | null;
	description: string;
	releaseYear: number;
	tmdbRating: number;
	imdbRating: string | null;
	rtRating: string | null;
	imdbUrl: string | null;
	/** Main external link (Letterboxd for movies, TMDB for series) */
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
}

/** Hooks a media type plugs into. */
export interface MediaProvider {
	id: MediaType;
	pick(
		filters: MediaFilters,
		excludeIds: number[],
	): Promise<EnrichedMedia | null>;
	listWatchProviders(
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
			const item = await fetchRandomItem(kind, filters, excludeIds);
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
				tmdbId: item.id,
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

const PROVIDERS: Record<MediaType, MediaProvider> = {
	movie: tmdbProvider("movie"),
	tv: tmdbProvider("tv"),
};

export function getMediaProvider(type: MediaType): MediaProvider {
	return PROVIDERS[type];
}
