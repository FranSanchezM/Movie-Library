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
import {
	COUNTRIES,
	DEFAULT_COUNTRY,
	DEFAULT_LANGUAGE,
	LANGUAGES,
	deliveryDayLabel,
	getCurrentYear,
} from "@/lib/profile-options";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { createProfileAction } from "./actions";

export default function OnboardingForm() {
	const router = useRouter();
	const [step, setStep] = useState(1);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [form, setForm] = useState<ProfileFormValues>({
		name: "",
		language: DEFAULT_LANGUAGE,
		country: DEFAULT_COUNTRY,
		genres: [],
		yearFrom: 1990,
		yearTo: getCurrentYear(),
		providerIds: [],
		dayOfWeek: 6,
		receivesEmails: true,
	});

	const handleChange = useCallback((patch: Partial<ProfileFormValues>) => {
		setForm((prev) => ({ ...prev, ...patch }));
	}, []);

	async function handleSubmit() {
		setSubmitting(true);
		setError(null);

		try {
			try {
				await createProfileAction(toProfileInput(form));
			} catch (e) {
				setError(
					e instanceof Error && e.message
						? e.message
						: "No se pudo crear el perfil. Intentá de nuevo.",
				);
				setSubmitting(false);
				return;
			}

			// Trigger first recommendation and wait for it
			try {
				await fetch("/api/recommend", { method: "POST" });
			} catch (err) {
				console.error("Error generating first recommendation:", err);
			}

			router.push("/");
		} catch {
			setError("Error inesperado. Intentá de nuevo.");
			setSubmitting(false);
		}
	}

	return (
		<>
			<ProfileFormStyles />

			<div className="ob-root">
				<div className="ob-card">
					{/* Logo */}
					<div className="ob-logo">
						<span className="ob-logo-emoji">🎬</span>
						<span className="ob-logo-text">CineRandom</span>
					</div>

					{/* Progress bars */}
					<div className="ob-progress">
						{[1, 2, 3].map((s) => (
							<div
								key={s}
								className={`ob-progress-bar${step >= s ? " active" : ""}`}
							/>
						))}
					</div>

					{/* ───────── STEP 1: Profile ───────── */}
					{step === 1 && (
						<>
							<div>
								<h1 className="ob-step-title">Creá tu perfil</h1>
								<p className="ob-step-subtitle">
									Te recomendaremos películas por email según tus gustos.
								</p>
							</div>

							<IdentityFields values={form} onChange={handleChange} />
							<LocaleFields values={form} onChange={handleChange} />

							<div className="ob-actions">
								<button
									type="button"
									className="ob-btn-primary"
									disabled={!isIdentityValid(form)}
									onClick={() => setStep(2)}
								>
									Siguiente →
								</button>
							</div>
						</>
					)}

					{/* ───────── STEP 2: Preferences ───────── */}
					{step === 2 && (
						<>
							<div>
								<h1 className="ob-step-title">Tus gustos</h1>
								<p className="ob-step-subtitle">
									Elegí géneros, años y las plataformas que tenés.
								</p>
							</div>

							<TasteFields values={form} onChange={handleChange} />

							<div className="ob-actions">
								<button
									type="button"
									className="ob-btn-secondary"
									onClick={() => setStep(1)}
								>
									← Atrás
								</button>
								<button
									type="button"
									className="ob-btn-primary"
									disabled={!isTasteValid(form)}
									onClick={() => setStep(3)}
								>
									Siguiente →
								</button>
							</div>
						</>
					)}

					{/* ───────── STEP 3: Delivery day + Confirm ───────── */}
					{step === 3 && (
						<>
							<div>
								<h1 className="ob-step-title">Día de envío</h1>
								<p className="ob-step-subtitle">
									¿Qué día de la semana querés recibir tu recomendación?
								</p>
							</div>

							<DeliveryFields values={form} onChange={handleChange} />

							{/* Summary */}
							<div>
								<div className="ob-summary-row">
									<span>Nombre</span>
									<span>{form.name}</span>
								</div>
								<div className="ob-summary-row">
									<span>Idioma</span>
									<span>
										{LANGUAGES.find((l) => l.id === form.language)?.label}
									</span>
								</div>
								<div className="ob-summary-row">
									<span>País</span>
									<span>
										{COUNTRIES.find((c) => c.code === form.country)?.label}
									</span>
								</div>
								<div className="ob-summary-row">
									<span>Géneros</span>
									<span>{form.genres.length} seleccionados</span>
								</div>
								<div className="ob-summary-row">
									<span>Años</span>
									<span>
										{form.yearFrom} – {form.yearTo}
									</span>
								</div>
								<div className="ob-summary-row">
									<span>Plataformas</span>
									<span>
										{form.providerIds.length > 0
											? `${form.providerIds.length} seleccionadas`
											: "Todas"}
									</span>
								</div>
								<div className="ob-summary-row">
									<span>Envío</span>
									<span>Semanal ({deliveryDayLabel(form.dayOfWeek)})</span>
								</div>
							</div>

							{error && <p className="ob-error">{error}</p>}

							<div className="ob-actions">
								<button
									type="button"
									className="ob-btn-secondary"
									onClick={() => setStep(2)}
									disabled={submitting}
								>
									← Atrás
								</button>
								<button
									type="button"
									className="ob-btn-primary"
									onClick={handleSubmit}
									disabled={submitting}
								>
									{submitting ? "Creando…" : "🎬 Crear perfil"}
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</>
	);
}
