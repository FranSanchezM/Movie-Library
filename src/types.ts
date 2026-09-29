import type { Icons } from "@/components/icons";
import type { MediaType } from "@/config/media";

export type { MediaType };

interface NavItem {
	title: string;
	href?: string;
	disabled?: boolean;
	external?: boolean;
	icon?: keyof typeof Icons;
	label?: string;
}

export type Language = "es" | "en";

/** 0 = Sunday, 6 = Saturday. Only weekend delivery is supported. */
export type DeliveryDay = 0 | 6;

export interface Profile {
	id: string;
	/** Supabase Auth user. Null only for legacy profiles not yet claimed. */
	user_id: string | null;
	name: string;
	email: string;
	language: Language;
	/** ISO 3166-1 alpha-2, uppercase. */
	country: string;
	day_of_week: DeliveryDay;
	receives_emails: boolean;
	created_at: string;
}

/** Recommendation preferences of a profile for one media type. */
export interface ProfilePreferences {
	profile_id: string;
	media_type: MediaType;
	enabled: boolean;
	/** Genre ids of that media type (TMDB movie and TV ids differ). */
	genres: number[];
	year_from: number;
	year_to: number;
	/** TMDB watch provider ids the user subscribes to. Empty = no filter. */
	provider_ids: number[];
	/** Media-specific options (books: length, language, min_rating). */
	options: Record<string, string | number>;
}

/** One library per profile and calendar year (holds every media type). */
export interface Library {
	id: string;
	profile_id: string;
	year: number;
	created_at: string;
}

export interface Recommendation {
	id: string;
	profile_id: string;
	library_id: string;
	media_type: MediaType;
	/** Id in the source catalog (TMDB id, Open Library work id, ...) */
	external_id: string;
	/** Only for TMDB-backed types */
	tmdb_id: number | null;
	/** Author(s) (books) */
	creator: string | null;
	imdb_id: string | null;
	title: string;
	slug: string | null;
	poster_path: string | null;
	description: string | null;
	release_year: number | null;
	tmdb_rating: number | null;
	imdb_rating: string | null;
	rt_rating: string | null;
	/** Generic source rating out of 5 (books: Open Library) and its vote count */
	rating: number | null;
	rating_count: number | null;
	/** Page count (books) */
	pages: number | null;
	/** Number of seasons (series only). */
	seasons: number | null;
	is_seen: boolean | null;
	feedback: "liked" | "disliked" | null;
	recommended_at: string;
}

interface NavItemWithChildren extends NavItem {
	items: NavItemWithChildren[];
}

export interface MainNavItem extends Omit<NavItem, "href"> {
	href: string;
}

export interface SidebarNavItem extends NavItemWithChildren {}

export interface PropsWithClassName {
	className?: string;
}
