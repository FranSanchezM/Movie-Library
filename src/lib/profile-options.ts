import type { DeliveryDay, Language } from "@/types";

// Shared (client + server) option lists and constants for profile preferences.

// TMDB genres with IDs
export const GENRES = [
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
] as const;

export const GENRE_LABELS: Record<number, string> = Object.fromEntries(
	GENRES.map((g) => [g.id, g.label]),
);

export const DELIVERY_DAYS: {
	id: DeliveryDay;
	label: string;
	plural: string;
}[] = [
	{ id: 6, label: "Sábado", plural: "Sábados" },
	{ id: 0, label: "Domingo", plural: "Domingos" },
];

export const LANGUAGES: { id: Language; label: string }[] = [
	{ id: "es", label: "Español" },
	{ id: "en", label: "English" },
];

export const COUNTRIES = [
	{ code: "AR", label: "Argentina" },
	{ code: "BO", label: "Bolivia" },
	{ code: "BR", label: "Brasil" },
	{ code: "CA", label: "Canadá" },
	{ code: "CL", label: "Chile" },
	{ code: "CO", label: "Colombia" },
	{ code: "CR", label: "Costa Rica" },
	{ code: "DE", label: "Alemania" },
	{ code: "DO", label: "República Dominicana" },
	{ code: "EC", label: "Ecuador" },
	{ code: "ES", label: "España" },
	{ code: "FR", label: "Francia" },
	{ code: "GB", label: "Reino Unido" },
	{ code: "GT", label: "Guatemala" },
	{ code: "IT", label: "Italia" },
	{ code: "MX", label: "México" },
	{ code: "PA", label: "Panamá" },
	{ code: "PE", label: "Perú" },
	{ code: "PT", label: "Portugal" },
	{ code: "PY", label: "Paraguay" },
	{ code: "US", label: "Estados Unidos" },
	{ code: "UY", label: "Uruguay" },
	{ code: "VE", label: "Venezuela" },
] as const;

export const DEFAULT_COUNTRY = "AR";
export const DEFAULT_LANGUAGE: Language = "es";
export const MIN_YEAR = 1900;

export function getCurrentYear(): number {
	return new Date().getUTCFullYear();
}

export function deliveryDayLabel(day: number, plural = false): string {
	const d = DELIVERY_DAYS.find((x) => x.id === day);
	if (!d) return "";
	return plural ? d.plural : d.label;
}
