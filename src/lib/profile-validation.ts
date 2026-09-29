import {
	MEDIA_TYPES,
	type MediaType,
	getMediaConfig,
	isMediaType,
} from "@/config/media";
import type { DeliveryDay, Language } from "@/types";
import { MIN_YEAR, getCurrentYear } from "./profile-options";

/** Profile-level settings (identity comes from the auth session). */
export interface ProfileInput {
	name: string;
	language: Language;
	country: string;
	day_of_week: DeliveryDay;
	receives_emails: boolean;
}

/** Preferences for one media type. */
export interface MediaPreferencesInput {
	media_type: MediaType;
	enabled: boolean;
	genres: number[];
	year_from: number;
	year_to: number;
	provider_ids: number[];
}

export interface SettingsInput {
	profile: ProfileInput;
	preferences: MediaPreferencesInput[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

function parseProfile(d: Record<string, unknown>): ProfileInput {
	const name = typeof d.name === "string" ? d.name.trim() : "";
	if (name.length < 2 || name.length > 80) {
		throw new Error("El nombre debe tener entre 2 y 80 caracteres");
	}
	if (!isValidLanguage(d.language)) throw new Error("Idioma inválido");
	if (!isValidCountry(d.country)) throw new Error("País inválido");
	if (d.day_of_week !== 0 && d.day_of_week !== 6) {
		throw new Error("El día de envío debe ser sábado o domingo");
	}

	return {
		name,
		language: d.language,
		country: d.country,
		day_of_week: d.day_of_week,
		receives_emails: d.receives_emails !== false,
	};
}

export function parsePreferences(
	d: Record<string, unknown>,
): MediaPreferencesInput {
	if (!isMediaType(d.media_type)) throw new Error("Tipo de contenido inválido");
	const config = getMediaConfig(d.media_type);
	const validGenres = new Set<number>(config.genres.map((g) => g.id));
	const enabled = d.enabled === true;

	if (
		!Array.isArray(d.genres) ||
		d.genres.length > validGenres.size * 2 ||
		!d.genres.every((g) => isPositiveInt(g) && validGenres.has(g))
	) {
		throw new Error(`Géneros inválidos para ${config.label.toLowerCase()}`);
	}
	const genres = [...new Set(d.genres as number[])];
	if (enabled && genres.length === 0) {
		throw new Error(
			`Elegí al menos un género de ${config.label.toLowerCase()}`,
		);
	}

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

	return {
		media_type: d.media_type,
		enabled,
		genres,
		year_from: d.year_from as number,
		year_to: d.year_to as number,
		provider_ids: [...new Set(providerRaw as number[])],
	};
}

/**
 * Validates untrusted settings from a client. Throws an Error with a
 * user-facing (Spanish) message when something is invalid.
 */
export function parseSettingsInput(raw: unknown): SettingsInput {
	if (typeof raw !== "object" || raw === null) {
		throw new Error("Datos inválidos");
	}
	const d = raw as Record<string, unknown>;
	if (typeof d.profile !== "object" || d.profile === null) {
		throw new Error("Datos inválidos");
	}
	if (
		!Array.isArray(d.preferences) ||
		d.preferences.length === 0 ||
		d.preferences.length > MEDIA_TYPES.length
	) {
		throw new Error("Datos inválidos");
	}

	const preferences = d.preferences.map((p) => {
		if (typeof p !== "object" || p === null) throw new Error("Datos inválidos");
		return parsePreferences(p as Record<string, unknown>);
	});

	if (
		new Set(preferences.map((p) => p.media_type)).size !== preferences.length
	) {
		throw new Error("Datos inválidos");
	}

	return {
		profile: parseProfile(d.profile as Record<string, unknown>),
		preferences,
	};
}
