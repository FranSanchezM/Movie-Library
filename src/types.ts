import type { Icons } from "@/components/icons";

interface NavItem {
	title: string;
	href?: string;
	disabled?: boolean;
	external?: boolean;
	icon?: keyof typeof Icons;
	label?: string;
}

export interface Library {
	id: string;
	name: string;
	email: string;
	genres: number[];
	year_from: number;
	year_to: number;
	frequency: "daily" | "weekly";
	day_of_week: number | null;
	receives_emails: boolean;
	created_at: string;
}

export interface Recommendation {
	id: string;
	library_id: string;
	tmdb_id: number;
	imdb_id: string | null;
	title: string;
	slug: string | null;
	poster_path: string | null;
	description: string | null;
	release_year: number | null;
	tmdb_rating: number | null;
	imdb_rating: string | null;
	rt_rating: string | null;
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
