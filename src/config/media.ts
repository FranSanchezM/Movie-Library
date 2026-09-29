// Media type registry (client + server safe: no server-only imports).
// Adding a media type = add an entry here + a provider in src/lib/media.ts.

export type MediaType = "movie" | "tv" | "book";

export interface Genre {
	id: number;
	label: string;
	/** Source-specific key (Open Library subject slug for books) */
	key?: string;
}

/** Media-specific preference stored in profile_preferences.options. */
export type OptionValue = string | number;

export interface OptionField {
	key: string;
	label: string;
	choices: readonly { value: OptionValue; label: string }[];
	/** "profile-language" resolves to the profile language when it is a choice */
	default: OptionValue | "profile-language";
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
	/** Distinctive card detail (book spine edge) */
	cardEdge?: "spine";
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
	/** Watch-provider (streaming platform) filter applies */
	usesProviders: boolean;
	/** First year offered by default in the year range */
	defaultYearFrom: number;
	/** Extra per-media preferences, rendered generically by the forms */
	fields: readonly OptionField[];
}

/** A section that is planned but not implemented yet. */
export interface UpcomingSection extends SectionBase {
	id: string;
	available: false;
}

export type Section = MediaTypeConfig | UpcomingSection;

const SERIF = "Georgia, 'Times New Roman', serif";
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

// Open Library subjects (key = subject slug)
const BOOK_GENRES: readonly Genre[] = [
	{ id: 1, label: "Ficción", key: "fiction" },
	{ id: 2, label: "Ciencia ficción", key: "science_fiction" },
	{ id: 3, label: "Fantasía", key: "fantasy" },
	{ id: 4, label: "Misterio", key: "mystery" },
	{ id: 5, label: "Thriller", key: "thriller" },
	{ id: 6, label: "Romance", key: "romance" },
	{ id: 7, label: "Terror", key: "horror" },
	{ id: 8, label: "Novela histórica", key: "historical_fiction" },
	{ id: 9, label: "Biografía", key: "biography" },
	{ id: 10, label: "Ensayo y no ficción", key: "nonfiction" },
	{ id: 11, label: "Ciencia", key: "science" },
	{ id: 12, label: "Historia", key: "history" },
	{ id: 13, label: "Filosofía", key: "philosophy" },
	{ id: 14, label: "Psicología", key: "psychology" },
	{ id: 15, label: "Autoayuda", key: "self-help" },
	{ id: 16, label: "Negocios", key: "business" },
	{ id: 17, label: "Cómic y novela gráfica", key: "graphic_novels" },
	{ id: 18, label: "Poesía", key: "poetry" },
	{ id: 19, label: "Clásicos", key: "classic_literature" },
	{ id: 20, label: "Juvenil", key: "young_adult_fiction" },
];

const BOOK_FIELDS: readonly OptionField[] = [
	{
		key: "length",
		label: "Extensión",
		choices: [
			{ value: "short", label: "Corto (menos de 250 pág.)" },
			{ value: "medium", label: "Medio (250 a 450 pág.)" },
			{ value: "long", label: "Largo (más de 450 pág.)" },
			{ value: "any", label: "Cualquiera" },
		],
		default: "any",
	},
	{
		key: "language",
		label: "Idioma del libro",
		choices: [
			{ value: "es", label: "Español" },
			{ value: "en", label: "Inglés" },
			{ value: "any", label: "Cualquiera" },
		],
		default: "profile-language",
	},
	{
		key: "min_rating",
		label: "Valoración mínima",
		choices: [
			{ value: 3, label: "3,0 o más" },
			{ value: 3.5, label: "3,5 o más" },
			{ value: 4, label: "4,0 o más" },
		],
		default: 3.5,
	},
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
		usesProviders: true,
		defaultYearFrom: 1990,
		fields: [],
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
		usesProviders: true,
		defaultYearFrom: 1990,
		fields: [],
	},
	{
		id: "book",
		slug: "libros",
		label: "Libros",
		singular: "Libro",
		icon: "📚",
		available: true,
		tagline: "Una lectura nueva cada semana, a tu medida.",
		// Warm paper / sepia, serif titles, spine-like card edge
		theme: {
			dark: { accent: "#D9B382", accent2: "#B08968", accentFg: "#1A1208" },
			light: { accent: "#8A5A2B", accent2: "#6B4423", accentFg: "#FFFFFF" },
			cardRadius: "4px",
			posterRatio: "2 / 3",
			titleFont: SERIF,
			titleTracking: "0",
			titleTransform: "none",
			cardEdge: "spine",
		},
		primaryLinkLabel: "OPEN LIBRARY",
		genres: BOOK_GENRES,
		usesProviders: false,
		defaultYearFrom: 1900,
		fields: BOOK_FIELDS,
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

/** Default options of a media type (profile-language resolved against the choices). */
export function defaultOptions(
	mediaType: MediaType,
	profileLanguage: string,
): Record<string, OptionValue> {
	const out: Record<string, OptionValue> = {};
	for (const f of getMediaConfig(mediaType).fields) {
		out[f.key] =
			f.default === "profile-language"
				? f.choices.some((c) => c.value === profileLanguage)
					? profileLanguage
					: "any"
				: f.default;
	}
	return out;
}
