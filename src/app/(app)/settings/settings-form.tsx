"use client";

import { updateProfileAction } from "@/app/settings-actions";
import {
	DeliveryFields,
	IdentityFields,
	LocaleFields,
	type MediaPrefsChange,
	MediaSection,
	type PrefsByType,
	type ProfileFormValues,
	defaultPrefs,
	isIdentityValid,
	isTasteValid,
	toSettingsInput,
} from "@/components/profile/profile-fields";
import { ProfileFormStyles } from "@/components/profile/profile-form-styles";
import { MEDIA_TYPES, defaultOptions } from "@/config/media";
import type { Profile, ProfilePreferences } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export default function SettingsForm({
	profile,
	preferences,
}: {
	profile: Profile;
	preferences: ProfilePreferences[];
}) {
	const router = useRouter();
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);

	const [form, setForm] = useState<ProfileFormValues>({
		name: profile.name,
		language: profile.language,
		country: profile.country,
		dayOfWeek: profile.day_of_week,
		receivesEmails: profile.receives_emails,
	});

	// Media types without a stored row start disabled with sensible defaults
	const [prefs, setPrefs] = useState<PrefsByType>(() =>
		Object.fromEntries(
			MEDIA_TYPES.map((m) => {
				const row = preferences.find((p) => p.media_type === m.id);
				return [
					m.id,
					row
						? {
								enabled: row.enabled,
								genres: row.genres,
								yearFrom: row.year_from,
								yearTo: row.year_to,
								providerIds: row.provider_ids,
								options: {
									...defaultOptions(m.id, profile.language),
									...(row.options ?? {}),
								},
							}
						: defaultPrefs(false, m.id, profile.language),
				];
			}),
		),
	);

	const handlePrefsChange = useCallback<MediaPrefsChange>((type, patch) => {
		setSaved(false);
		setPrefs((prev) => {
			const current = prev[type];
			return current ? { ...prev, [type]: { ...current, ...patch } } : prev;
		});
	}, []);

	const handleChange = useCallback((patch: Partial<ProfileFormValues>) => {
		setSaved(false);
		setForm((prev) => ({ ...prev, ...patch }));
	}, []);

	async function handleSave() {
		setSaving(true);
		setError(null);
		setSaved(false);

		try {
			await updateProfileAction(toSettingsInput(form, prefs));
			setSaved(true);
			router.refresh();
		} catch (e) {
			setError(
				e instanceof Error && e.message
					? e.message
					: "No se pudo guardar la configuración",
			);
		} finally {
			setSaving(false);
		}
	}

	const prefList = Object.values(prefs);
	const canSave =
		isIdentityValid(form) && prefList.every(isTasteValid) && !saving;

	return (
		<>
			<ProfileFormStyles />

			<div className="ob-root ob-embedded">
				<div className="ob-card">
					<div>
						<h1 className="ob-step-title">Configuración</h1>
						<p className="ob-step-subtitle">
							Editá tu perfil y tus preferencias de recomendación.
						</p>
					</div>

					<h2 className="ob-section-title">Perfil</h2>
					<IdentityFields
						values={form}
						onChange={handleChange}
						disabled={saving}
					/>
					<LocaleFields
						values={form}
						onChange={handleChange}
						disabled={saving}
					/>

					{MEDIA_TYPES.map((m) => {
						const values = prefs[m.id];
						return values ? (
							<MediaSection
								key={m.id}
								mediaType={m.id}
								values={values}
								country={form.country}
								language={form.language}
								onChange={handlePrefsChange}
								disabled={saving}
							/>
						) : null;
					})}

					<h2 className="ob-section-title">Envío</h2>
					<DeliveryFields
						values={form}
						onChange={handleChange}
						disabled={saving}
					/>

					{error && <p className="ob-error">{error}</p>}
					{saved && <p className="ob-success">Cambios guardados.</p>}

					<div className="ob-actions">
						<Link href="/" className="ob-btn-secondary">
							← Volver
						</Link>
						<button
							type="button"
							className="ob-btn-primary"
							onClick={handleSave}
							disabled={!canSave}
						>
							{saving ? "Guardando…" : "Guardar cambios"}
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
