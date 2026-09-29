import type { DeliveryDay, Language } from "@/types";
import { GENRES, MIN_YEAR, getCurrentYear } from "./profile-options";

/** Everything the user can edit on a profile. */
export interface ProfileInput {
	name: string;
	language: Language;
	country: string;
	genres: number[];
	year_from: number;
	year_to: number;
	provider_ids: number[];
	day_of_week: DeliveryDay;
	receives_emails: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENRE_IDS = new Set<number>(GENRES.map((g) => g.id));
const MAX_PROVIDERS = 100;
const MAX_PROVIDER_ID = 1e7;

export function isValidEmail(email: string): boolean {
	return email.length <= 254 && EMAIL_RE.test(email);
}

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function isValidCountry(country: unknown): country is string {
	return typeof country === "string" && /^[A-Z]{2}$/.test(country);
}

export function isValidLanguage(language: unknown): language is Language {
	return language === "es" || language === "en";
}

function isPositiveInt(n: unknown): n is number {
	return typeof n === "number" && Number.isInteger(n) && n > 0;
}

/**
 * Validates untrusted input from a client (the email comes from the auth session). Throws an Error with a
 * user-facing (Spanish) message when something is invalid.
 */
export function parseProfileInput(raw: unknown): ProfileInput {
	if (typeof raw !== "object" || raw === null) {
		throw new Error("Datos inválidos");
	}
	const d = raw as Record<string, unknown>;

	const name = typeof d.name === "string" ? d.name.trim() : "";
	if (name.length < 2 || name.length > 80) {
		throw new Error("El nombre debe tener entre 2 y 80 caracteres");
	}

	if (!isValidLanguage(d.language)) {
		throw new Error("Idioma inválido");
	}

	if (!isValidCountry(d.country)) {
		throw new Error("País inválido");
	}

	if (
		!Array.isArray(d.genres) ||
		d.genres.length === 0 ||
		d.genres.length > GENRE_IDS.size * 2 ||
		!d.genres.every((g) => isPositiveInt(g) && GENRE_IDS.has(g))
	) {
		throw new Error("Elegí al menos un género válido");
	}
	const genres = [...new Set(d.genres as number[])];

	const maxYear = getCurrentYear();
	if (
		!Number.isSafeInteger(d.year_from) ||
		!Number.isSafeInteger(d.year_to) ||
		(d.year_from as number) < MIN_YEAR ||
		(d.year_to as number) > maxYear ||
		(d.year_from as number) > (d.year_to as number)
	) {
		throw new Error(
			`El rango de años debe estar entre ${MIN_YEAR} y ${maxYear}`,
		);
	}

	const providerRaw = d.provider_ids ?? [];
	if (
		!Array.isArray(providerRaw) ||
		providerRaw.length > MAX_PROVIDERS ||
		!providerRaw.every((p) => isPositiveInt(p) && p <= MAX_PROVIDER_ID)
	) {
		throw new Error("Plataformas inválidas");
	}
	const provider_ids = [...new Set(providerRaw as number[])];

	if (d.day_of_week !== 0 && d.day_of_week !== 6) {
		throw new Error("El día de envío debe ser sábado o domingo");
	}

	return {
		name,
		language: d.language,
		country: d.country,
		genres,
		year_from: d.year_from as number,
		year_to: d.year_to as number,
		provider_ids,
		day_of_week: d.day_of_week,
		receives_emails: d.receives_emails !== false,
	};
}
