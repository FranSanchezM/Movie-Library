import type { DeliveryDay, Language } from "@/types";

// Shared (client + server) option lists and constants for profile preferences.

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
