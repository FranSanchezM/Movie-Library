"use client";

import { saveMediaPreferencesAction } from "@/app/settings-actions";
import {
	type MediaPrefsChange,
	type MediaPrefsValues,
	TasteFields,
	defaultPrefs,
	isTasteValid,
} from "@/components/profile/profile-fields";
import { ProfileFormStyles } from "@/components/profile/profile-form-styles";
import { type MediaType, getMediaConfig } from "@/config/media";
import type { Language } from "@/types";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

/**
 * Empty state of a section without a library: an invitation plus the
 * per-media preferences form (genres, years, platforms). Country and
 * language come from the profile.
 */
export function CreateLibrary({
	mediaType,
	country,
	language,
}: {
	mediaType: MediaType;
	country: string;
	language: Language;
}) {
	const router = useRouter();
	const config = getMediaConfig(mediaType);
	const [open, setOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [prefs, setPrefs] = useState<MediaPrefsValues>(
		defaultPrefs(true, mediaType, language),
	);

	const handleChange = useCallback<MediaPrefsChange>((_type, patch) => {
		setPrefs((prev) => ({ ...prev, ...patch }));
	}, []);

	async function handleCreate() {
		setSaving(true);
		setError(null);
		try {
			await saveMediaPreferencesAction({
				media_type: mediaType,
				genres: prefs.genres,
				year_from: prefs.yearFrom,
				year_to: prefs.yearTo,
				provider_ids: prefs.providerIds,
				options: prefs.options,
			});
			router.refresh();
		} catch (e) {
			setError(
				e instanceof Error && e.message
					? e.message
					: "No se pudo crear la biblioteca",
			);
			setSaving(false);
		}
	}

	return (
		<div
			className="m-panel"
			style={{
				maxWidth: 640,
				margin: "0 auto",
				padding: "2rem 1.5rem",
				display: "flex",
				flexDirection: "column",
				gap: "1.5rem",
			}}
		>
			<ProfileFormStyles />
			<div style={{ textAlign: "center" }}>
				<div style={{ fontSize: "3rem", lineHeight: 1 }}>{config.icon}</div>
				<h2
					className="m-title"
					style={{ fontSize: "1.9rem", margin: "0.75rem 0 0.25rem" }}
				>
					Aún no tienes una biblioteca de {config.label.toLowerCase()}
				</h2>
				<p style={{ color: "#888", fontSize: "0.9rem", margin: 0 }}>
					{config.tagline} Elige tus gustos y recibe una recomendación cada
					semana.
				</p>
			</div>

			{!open ? (
				<div style={{ textAlign: "center" }}>
					<button type="button" className="m-btn" onClick={() => setOpen(true)}>
						Crear biblioteca de {config.label}
					</button>
				</div>
			) : (
				<>
					<TasteFields
						mediaType={mediaType}
						values={prefs}
						country={country}
						language={language}
						onChange={handleChange}
						disabled={saving}
					/>
					{error && <p className="ob-error">{error}</p>}
					<div className="ob-actions">
						<button
							type="button"
							className="ob-btn-secondary"
							onClick={() => setOpen(false)}
							disabled={saving}
						>
							Cancelar
						</button>
						<button
							type="button"
							className="m-btn"
							onClick={handleCreate}
							disabled={saving || !isTasteValid(prefs)}
						>
							{saving ? "Creando…" : `Crear biblioteca de ${config.label}`}
						</button>
					</div>
				</>
			)}
		</div>
	);
}
