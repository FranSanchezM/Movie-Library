"use client";

import {
	DeliveryFields,
	IdentityFields,
	LocaleFields,
	type ProfileFormValues,
	TasteFields,
	isIdentityValid,
	isTasteValid,
	toProfileInput,
} from "@/components/profile/profile-fields";
import { ProfileFormStyles } from "@/components/profile/profile-form-styles";
import type { Profile } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { updateProfileAction } from "../settings-actions";

export default function SettingsForm({ profile }: { profile: Profile }) {
	const router = useRouter();
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);

	const [form, setForm] = useState<ProfileFormValues>({
		name: profile.name,
		language: profile.language,
		country: profile.country,
		genres: profile.genres,
		yearFrom: profile.year_from,
		yearTo: profile.year_to,
		providerIds: profile.provider_ids ?? [],
		dayOfWeek: profile.day_of_week,
		receivesEmails: profile.receives_emails,
	});

	const handleChange = useCallback((patch: Partial<ProfileFormValues>) => {
		setSaved(false);
		setForm((prev) => ({ ...prev, ...patch }));
	}, []);

	async function handleSave() {
		setSaving(true);
		setError(null);
		setSaved(false);

		try {
			await updateProfileAction(toProfileInput(form));
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

	const canSave = isIdentityValid(form) && isTasteValid(form) && !saving;

	return (
		<>
			<ProfileFormStyles />

			<div className="ob-root">
				<div className="ob-card">
					<div className="ob-logo">
						<span className="ob-logo-emoji">🎬</span>
						<span className="ob-logo-text">CineRandom</span>
					</div>

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

					<h2 className="ob-section-title">Gustos</h2>
					<TasteFields
						values={form}
						onChange={handleChange}
						disabled={saving}
					/>

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
