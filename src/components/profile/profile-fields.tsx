"use client";

import { getWatchProvidersAction } from "@/app/settings-actions";
import {
	COUNTRIES,
	DELIVERY_DAYS,
	GENRES,
	LANGUAGES,
	MIN_YEAR,
	getCurrentYear,
} from "@/lib/profile-options";
import type { ProfileInput } from "@/lib/profile-validation";
import type { WatchProvider } from "@/lib/tmdb";
import type { DeliveryDay, Language } from "@/types";
import { useEffect, useState } from "react";

/** Client-side form state (camelCase mirror of ProfileInput). */
export interface ProfileFormValues {
	name: string;
	language: Language;
	country: string;
	genres: number[];
	yearFrom: number;
	yearTo: number;
	providerIds: number[];
	dayOfWeek: DeliveryDay;
	receivesEmails: boolean;
}

export type ProfileFormChange = (patch: Partial<ProfileFormValues>) => void;

interface FieldsProps {
	values: ProfileFormValues;
	onChange: ProfileFormChange;
	disabled?: boolean;
}

export function toProfileInput(values: ProfileFormValues): ProfileInput {
	return {
		name: values.name.trim(),
		language: values.language,
		country: values.country,
		genres: values.genres,
		year_from: values.yearFrom,
		year_to: values.yearTo,
		provider_ids: values.providerIds,
		day_of_week: values.dayOfWeek,
		receives_emails: values.receivesEmails,
	};
}

export function isIdentityValid(v: ProfileFormValues): boolean {
	return v.name.trim().length >= 2;
}

export function isTasteValid(v: ProfileFormValues): boolean {
	return (
		v.genres.length > 0 &&
		Number.isInteger(v.yearFrom) &&
		Number.isInteger(v.yearTo) &&
		v.yearFrom >= MIN_YEAR &&
		v.yearTo <= getCurrentYear() &&
		v.yearFrom <= v.yearTo
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
				<span className="ob-label">Idioma de las películas</span>
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

function useWatchProviders(country: string, language: Language) {
	const [providers, setProviders] = useState<WatchProvider[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		getWatchProvidersAction(country, language)
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
	}, [country, language]);

	return { providers, loading };
}

export function TasteFields({ values, onChange, disabled }: FieldsProps) {
	const { providers, loading } = useWatchProviders(
		values.country,
		values.language,
	);
	const { providerIds } = values;

	// Drop selected platforms that do not exist in the chosen country.
	useEffect(() => {
		if (providers.length === 0) return;
		const available = new Set(providers.map((p) => p.id));
		const kept = providerIds.filter((id) => available.has(id));
		if (kept.length !== providerIds.length) onChange({ providerIds: kept });
	}, [providers, providerIds, onChange]);

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
					{GENRES.map((g) => (
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
					Solo te recomendaremos películas disponibles en tus plataformas. Si no
					elegís ninguna, no se filtra por plataforma.
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
