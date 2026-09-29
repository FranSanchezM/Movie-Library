// Media type registry (client + server safe: no server-only imports).
// Adding a media type = add an entry here + a provider in src/lib/media.ts.

export type MediaType = "movie" | "tv";

export interface Genre {
	id: number;
	label: string;
}

export interface ThemeColors {
	/** Main accent (active nav item, buttons, highlights) */
	accent: string;
	/** Second color used in gradients */
	accent2: string;
	/** Text/icon color on top of the accent (contrast-checked) */
	accentFg: string;
}

/** Visual identity of a section, applied through CSS variables scoped by [data-media]. */
export interface MediaTheme {
	light: ThemeColors;
	dark: ThemeColors;
	/** Poster/card shape */
	cardRadius: string;
	posterRatio: string;
	/** Title style on cards and headings */
	titleFont: string;
	titleTracking: string;
	titleTransform: "none" | "uppercase";
}

/** Shared by implemented media types and upcoming sections. */
export interface SectionBase {
	slug: string; // URL segment: /peliculas
	label: string; // plural: "Películas"
	singular: string; // "Película"
	icon: string;
	/** False = shown in the sidebar as "Pronto" */
	available: boolean;
	theme: MediaTheme;
	/** Short pitch for Home cards and empty states */
	tagline: string;
}

export interface MediaTypeConfig extends SectionBase {
	id: MediaType;
	available: true;
	/** Label of the external link stored in recommendations.slug */
	primaryLinkLabel: string;
	genres: readonly Genre[];
}

/** A section that is planned but not implemented yet. */
export interface UpcomingSection extends SectionBase {
	id: string;
	available: false;
}

export type Section = MediaTypeConfig | UpcomingSection;

const BEBAS = "var(--font-bebas-neue), 'Bebas Neue', cursive";
const SANS = "var(--font-dm-sans), 'DM Sans', sans-serif";

// TMDB movie genres
const MOVIE_GENRES: readonly Genre[] = [
	{ id: 28, label: "Acción" },
	{ id: 12, label: "Aventura" },
	{ id: 16, label: "Animación" },
	{ id: 35, label: "Comedia" },
	{ id: 80, label: "Crimen" },
	{ id: 99, label: "Documental" },
	{ id: 18, label: "Drama" },
	{ id: 10751, label: "Familia" },
	{ id: 14, label: "Fantasía" },
	{ id: 36, label: "Historia" },
	{ id: 27, label: "Terror" },
	{ id: 10402, label: "Música" },
	{ id: 9648, label: "Misterio" },
	{ id: 10749, label: "Romance" },
	{ id: 878, label: "Ciencia ficción" },
	{ id: 53, label: "Suspenso" },
	{ id: 10752, label: "Bélica" },
	{ id: 37, label: "Western" },
];

// TMDB TV genres (ids differ from the movie ones)
const TV_GENRES: readonly Genre[] = [
	{ id: 10759, label: "Acción y aventura" },
	{ id: 16, label: "Animación" },
	{ id: 35, label: "Comedia" },
	{ id: 80, label: "Crimen" },
	{ id: 99, label: "Documental" },
	{ id: 18, label: "Drama" },
	{ id: 10751, label: "Familia" },
	{ id: 10762, label: "Infantil" },
	{ id: 9648, label: "Misterio" },
	{ id: 10764, label: "Reality" },
	{ id: 10765, label: "Ciencia ficción y fantasía" },
	{ id: 10766, label: "Telenovela" },
	{ id: 10768, label: "Guerra y política" },
	{ id: 37, label: "Western" },
];

export const MEDIA_TYPES: readonly MediaTypeConfig[] = [
	{
		id: "movie",
		slug: "peliculas",
		label: "Películas",
		singular: "Película",
		icon: "🎬",
		available: true,
		tagline: "Una película al azar cada semana, a tu medida.",
		// Cinematic: deep red + amber, sharp poster corners, condensed caps titles
		theme: {
			dark: { accent: "#F0533C", accent2: "#F2B84B", accentFg: "#0B0B0B" },
			light: { accent: "#B3261E", accent2: "#B26A00", accentFg: "#FFFFFF" },
			cardRadius: "6px",
			posterRatio: "2 / 3",
			titleFont: BEBAS,
			titleTracking: "0.05em",
			titleTransform: "none",
		},
		primaryLinkLabel: "LETTERBOXD",
		genres: MOVIE_GENRES,
	},
	{
		id: "tv",
		slug: "series",
		label: "Series",
		singular: "Serie",
		icon: "📺",
		available: true,
		tagline: "Tu próxima serie para maratonear, elegida por ti.",
		// Electric violet/blue, rounded wide cards, bold sans titles
		theme: {
			dark: { accent: "#8B7CFF", accent2: "#38BDF8", accentFg: "#0B0B0B" },
			light: { accent: "#4F46E5", accent2: "#0369A1", accentFg: "#FFFFFF" },
			cardRadius: "18px",
			posterRatio: "3 / 4",
			titleFont: SANS,
			titleTracking: "-0.01em",
			titleTransform: "none",
		},
		primaryLinkLabel: "TMDB",
		genres: TV_GENRES,
	},
];

function upcoming(
	id: string,
	slug: string,
	label: string,
	singular: string,
	icon: string,
	tagline: string,
	theme: Pick<MediaTheme, "light" | "dark"> &
		Partial<Omit<MediaTheme, "light" | "dark">>,
): UpcomingSection {
	return {
		id,
		slug,
		label,
		singular,
		icon,
		tagline,
		available: false,
		theme: {
			cardRadius: "10px",
			posterRatio: "2 / 3",
			titleFont: SANS,
			titleTracking: "0",
			titleTransform: "none",
			...theme,
		},
	};
}

export const UPCOMING_SECTIONS: readonly UpcomingSection[] = [
	upcoming(
		"book",
		"libros",
		"Libros",
		"Libro",
		"📚",
		"Lecturas para cada semana.",
		{
			// Warm paper / sepia
			dark: { accent: "#D9B382", accent2: "#B08968", accentFg: "#1A1208" },
			light: { accent: "#8A5A2B", accent2: "#6B4423", accentFg: "#FFFFFF" },
			cardRadius: "4px",
			posterRatio: "2 / 3",
		},
	),
	upcoming(
		"music",
		"musica",
		"Música",
		"Álbum",
		"🎧",
		"Discos para descubrir.",
		{
			// Magenta / neon
			dark: { accent: "#FF4FD8", accent2: "#7C3AED", accentFg: "#0B0B0B" },
			light: { accent: "#B0138F", accent2: "#5B21B6", accentFg: "#FFFFFF" },
			cardRadius: "999px",
			posterRatio: "1 / 1",
		},
	),
	upcoming("anime", "anime", "Anime", "Anime", "🌸", "Anime para tu lista.", {
		// Pink / cyan
		dark: { accent: "#FF7AB6", accent2: "#22D3EE", accentFg: "#0B0B0B" },
		light: { accent: "#B8326F", accent2: "#0E7490", accentFg: "#FFFFFF" },
		cardRadius: "14px",
	}),
	upcoming("game", "juegos", "Juegos", "Juego", "🎮", "Juegos para jugar.", {
		// Green / lime
		dark: { accent: "#9BE564", accent2: "#22C55E", accentFg: "#0B0B0B" },
		light: { accent: "#3F7D14", accent2: "#15803D", accentFg: "#FFFFFF" },
		cardRadius: "8px",
		posterRatio: "3 / 4",
	}),
];

/** Every section in sidebar order: implemented ones first, then upcoming. */
export const SECTIONS: readonly Section[] = [
	...MEDIA_TYPES,
	...UPCOMING_SECTIONS,
];

export function getSectionBySlug(slug: string): Section | undefined {
	return SECTIONS.find((s) => s.slug === slug);
}

export const DEFAULT_MEDIA_TYPE: MediaType = "movie";

export function isMediaType(value: unknown): value is MediaType {
	return MEDIA_TYPES.some((m) => m.id === value);
}

export function getMediaConfig(id: MediaType): MediaTypeConfig {
	return MEDIA_TYPES.find((m) => m.id === id) ?? MEDIA_TYPES[0];
}

export function genreLabels(id: MediaType): Record<number, string> {
	return Object.fromEntries(
		getMediaConfig(id).genres.map((g) => [g.id, g.label]),
	);
}

/** URL of a media section, optionally on a given yearly library. */
export function sectionHref(
	mediaType: MediaType,
	year?: number | null,
): string {
	const base = `/${getMediaConfig(mediaType).slug}`;
	return year ? `${base}?year=${year}` : base;
}
