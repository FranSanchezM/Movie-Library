"use client";

import { getWatchProvidersAction } from "@/app/settings-actions";
import { type MediaType, getMediaConfig } from "@/config/media";
import {
	COUNTRIES,
	DELIVERY_DAYS,
	LANGUAGES,
	MIN_YEAR,
	getCurrentYear,
} from "@/lib/profile-options";
import type { SettingsInput } from "@/lib/profile-validation";
import type { WatchProvider } from "@/lib/tmdb";
import type { DeliveryDay, Language } from "@/types";
import { useEffect, useState } from "react";

/** Profile-level form state. */
export interface ProfileFormValues {
	name: string;
	language: Language;
	country: string;
	dayOfWeek: DeliveryDay;
	receivesEmails: boolean;
}

/** Per-media-type preferences form state. */
export interface MediaPrefsValues {
	enabled: boolean;
	genres: number[];
	yearFrom: number;
	yearTo: number;
	providerIds: number[];
}

export type PrefsByType = Partial<Record<MediaType, MediaPrefsValues>>;

export type ProfileFormChange = (patch: Partial<ProfileFormValues>) => void;
export type MediaPrefsChange = (
	mediaType: MediaType,
	patch: Partial<MediaPrefsValues>,
) => void;

interface FieldsProps {
	values: ProfileFormValues;
	onChange: ProfileFormChange;
	disabled?: boolean;
}

export function defaultPrefs(enabled: boolean): MediaPrefsValues {
	return {
		enabled,
		genres: [],
		yearFrom: 1990,
		yearTo: getCurrentYear(),
		providerIds: [],
	};
}

export function toSettingsInput(
	values: ProfileFormValues,
	prefs: PrefsByType,
): SettingsInput {
	return {
		profile: {
			name: values.name.trim(),
			language: values.language,
			country: values.country,
			day_of_week: values.dayOfWeek,
			receives_emails: values.receivesEmails,
		},
		preferences: (Object.entries(prefs) as [MediaType, MediaPrefsValues][]).map(
			([media_type, p]) => ({
				media_type,
				enabled: p.enabled,
				genres: p.genres,
				year_from: p.yearFrom,
				year_to: p.yearTo,
				provider_ids: p.providerIds,
			}),
		),
	};
}

export function isIdentityValid(v: ProfileFormValues): boolean {
	return v.name.trim().length >= 2;
}

/** A disabled media type is always valid; an enabled one needs genres and a sane range. */
export function isTasteValid(p: MediaPrefsValues): boolean {
	if (!p.enabled) return true;
	return (
		p.genres.length > 0 &&
		Number.isInteger(p.yearFrom) &&
		Number.isInteger(p.yearTo) &&
		p.yearFrom >= MIN_YEAR &&
		p.yearTo <= getCurrentYear() &&
		p.yearFrom <= p.yearTo
	);
}

// ───────── Name, emails opt-in ─────────

export function IdentityFields({ values, onChange, disabled }: FieldsProps) {
	return (
		<div className="ob-stack">
			<div className="ob-field">
				<label className="ob-label" htmlFor="pf-name">
					Nombre
				</label>
				<input
					id="pf-name"
					className="ob-input"
					type="text"
					placeholder="Ej: Ana"
					value={values.name}
					disabled={disabled}
					onChange={(e) => onChange({ name: e.target.value })}
				/>
			</div>

			<div className="ob-check-row">
				<input
					type="checkbox"
					id="pf-receives-emails"
					checked={values.receivesEmails}
					disabled={disabled}
					onChange={(e) => onChange({ receivesEmails: e.target.checked })}
				/>
				<label htmlFor="pf-receives-emails">
					Recibir recomendaciones por email
				</label>
			</div>
		</div>
	);
}

// ───────── Language + country ─────────

export function LocaleFields({ values, onChange, disabled }: FieldsProps) {
	return (
		<div className="ob-stack">
			<div className="ob-field">
				<span className="ob-label">Idioma de títulos y descripciones</span>
				<div className="ob-genres">
					{LANGUAGES.map((l) => (
						<button
							type="button"
							key={l.id}
							disabled={disabled}
							className={`ob-genre-btn${values.language === l.id ? " selected" : ""}`}
							onClick={() => onChange({ language: l.id })}
						>
							{l.label}
						</button>
					))}
				</div>
				<p className="ob-hint">
					Define el idioma del título y la descripción de cada recomendación.
				</p>
			</div>

			<div className="ob-field">
				<label className="ob-label" htmlFor="pf-country">
					País
				</label>
				<select
					id="pf-country"
					className="ob-input"
					value={values.country}
					disabled={disabled}
					onChange={(e) => onChange({ country: e.target.value })}
				>
					{COUNTRIES.map((c) => (
						<option key={c.code} value={c.code}>
							{c.label}
						</option>
					))}
				</select>
				<p className="ob-hint">
					Se usa para saber qué plataformas de streaming están disponibles.
				</p>
			</div>
		</div>
	);
}

// ───────── Genres, years, streaming platforms ─────────

function useWatchProviders(
	mediaType: MediaType,
	country: string,
	language: Language,
) {
	const [providers, setProviders] = useState<WatchProvider[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		getWatchProvidersAction(mediaType, country, language)
			.then((list) => {
				if (!cancelled) setProviders(list);
			})
			.catch(() => {
				if (!cancelled) setProviders([]);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [mediaType, country, language]);

	return { providers, loading };
}

interface TasteFieldsProps {
	mediaType: MediaType;
	values: MediaPrefsValues;
	country: string;
	language: Language;
	onChange: MediaPrefsChange;
	disabled?: boolean;
}

export function TasteFields({
	mediaType,
	values,
	country,
	language,
	onChange: onPrefsChange,
	disabled,
}: TasteFieldsProps) {
	const config = getMediaConfig(mediaType);
	const { providers, loading } = useWatchProviders(
		mediaType,
		country,
		language,
	);
	const { providerIds } = values;
	const onChange = (patch: Partial<MediaPrefsValues>) =>
		onPrefsChange(mediaType, patch);

	// Drop selected platforms that do not exist in the chosen country.
	useEffect(() => {
		if (providers.length === 0) return;
		const available = new Set(providers.map((p) => p.id));
		const kept = providerIds.filter((id) => available.has(id));
		if (kept.length !== providerIds.length)
			onPrefsChange(mediaType, { providerIds: kept });
	}, [providers, providerIds, mediaType, onPrefsChange]);

	function toggleGenre(id: number) {
		onChange({
			genres: values.genres.includes(id)
				? values.genres.filter((g) => g !== id)
				: [...values.genres, id],
		});
	}

	function toggleProvider(id: number) {
		onChange({
			providerIds: providerIds.includes(id)
				? providerIds.filter((p) => p !== id)
				: [...providerIds, id],
		});
	}

	return (
		<div className="ob-stack">
			<div className="ob-field">
				<span className="ob-label">Géneros</span>
				<div className="ob-genres">
					{config.genres.map((g) => (
						<button
							type="button"
							key={g.id}
							disabled={disabled}
							className={`ob-genre-btn${values.genres.includes(g.id) ? " selected" : ""}`}
							onClick={() => toggleGenre(g.id)}
						>
							{g.label}
						</button>
					))}
				</div>
			</div>

			<div className="ob-field">
				<span className="ob-label">Rango de años</span>
				<div className="ob-range-row">
					<span className="ob-range-label">Desde</span>
					<input
						className="ob-input"
						type="number"
						aria-label="Año desde"
						min={MIN_YEAR}
						max={values.yearTo}
						value={values.yearFrom}
						disabled={disabled}
						onChange={(e) => onChange({ yearFrom: Number(e.target.value) })}
						style={{ maxWidth: 100 }}
					/>
					<span className="ob-range-label">hasta</span>
					<input
						className="ob-input"
						type="number"
						aria-label="Año hasta"
						min={values.yearFrom}
						max={getCurrentYear()}
						value={values.yearTo}
						disabled={disabled}
						onChange={(e) => onChange({ yearTo: Number(e.target.value) })}
						style={{ maxWidth: 100 }}
					/>
				</div>
			</div>

			<div className="ob-field">
				<span className="ob-label">Mis plataformas de streaming</span>
				{loading ? (
					<p className="ob-hint">Cargando plataformas…</p>
				) : providers.length === 0 ? (
					<p className="ob-hint">
						No pudimos cargar las plataformas para este país. Si no elegís
						ninguna, no se filtrará por plataforma.
					</p>
				) : (
					<div className="ob-genres ob-providers">
						{providers.map((p) => (
							<button
								type="button"
								key={p.id}
								disabled={disabled}
								className={`ob-genre-btn ob-provider-btn${providerIds.includes(p.id) ? " selected" : ""}`}
								onClick={() => toggleProvider(p.id)}
							>
								{p.logoPath && (
									<img
										className="ob-provider-logo"
										src={`https://image.tmdb.org/t/p/w45${p.logoPath}`}
										alt=""
										loading="lazy"
									/>
								)}
								{p.name}
							</button>
						))}
					</div>
				)}
				<p className="ob-hint">
					Solo te recomendaremos {config.label.toLowerCase()} disponibles en tus
					plataformas. Si no elegís ninguna, no se filtra por plataforma.
				</p>
			</div>
		</div>
	);
}

// ───────── Delivery day ─────────

export function DeliveryFields({ values, onChange, disabled }: FieldsProps) {
	return (
		<div className="ob-field">
			<span className="ob-label">Día de envío semanal</span>
			<div className="ob-genres">
				{DELIVERY_DAYS.map((d) => (
					<button
						type="button"
						key={d.id}
						disabled={disabled}
						className={`ob-genre-btn${values.dayOfWeek === d.id ? " selected" : ""}`}
						onClick={() => onChange({ dayOfWeek: d.id })}
					>
						{d.label}
					</button>
				))}
			</div>
			<p className="ob-hint">
				Recibís una recomendación por semana, los sábados o los domingos.
			</p>
		</div>
	);
}

// ───────── One media type block (settings) ─────────

interface MediaSectionProps extends Omit<TasteFieldsProps, "disabled"> {
	disabled?: boolean;
}

export function MediaSection(props: MediaSectionProps) {
	const { mediaType, values, onChange, disabled } = props;
	const config = getMediaConfig(mediaType);
	const id = `pf-enable-${mediaType}`;

	return (
		<div className="ob-stack">
			<h2 className="ob-section-title">
				{config.icon} {config.label}
			</h2>
			<div className="ob-check-row">
				<input
					type="checkbox"
					id={id}
					checked={values.enabled}
					disabled={disabled}
					onChange={(e) => onChange(mediaType, { enabled: e.target.checked })}
				/>
				<label htmlFor={id}>
					Recibir recomendaciones de {config.label.toLowerCase()}
				</label>
			</div>
			{values.enabled && <TasteFields {...props} />}
		</div>
	);
}
