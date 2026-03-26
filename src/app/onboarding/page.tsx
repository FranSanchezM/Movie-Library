"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createLibraryAction } from "./actions";

// TMDB genres with IDs
const GENRES = [
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
	{ id: 9648, label: "Misterio" },
	{ id: 10749, label: "Romance" },
	{ id: 878, label: "Sci-Fi" },
	{ id: 53, label: "Suspenso" },
	{ id: 10752, label: "Bélica" },
	{ id: 37, label: "Western" },
];

const DAYS = [
	{ id: 1, label: "Lunes" },
	{ id: 2, label: "Martes" },
	{ id: 3, label: "Miércoles" },
	{ id: 4, label: "Jueves" },
	{ id: 5, label: "Viernes" },
	{ id: 6, label: "Sábado" },
	{ id: 0, label: "Domingo" },
];

const CURRENT_YEAR = 2025;

interface FormState {
	name: string;
	email: string;
	genres: number[];
	yearFrom: number;
	yearTo: number;
	frequency: "daily" | "weekly";
	dayOfWeek: number;
}

export default function OnboardingPage() {
	const router = useRouter();
	const [step, setStep] = useState(1);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [form, setForm] = useState<FormState>({
		name: "",
		email: "",
		genres: [],
		yearFrom: 1990,
		yearTo: CURRENT_YEAR,
		frequency: "weekly",
		dayOfWeek: 1,
	});

	function toggleGenre(id: number) {
		setForm((prev) => ({
			...prev,
			genres: prev.genres.includes(id)
				? prev.genres.filter((g) => g !== id)
				: [...prev.genres, id],
		}));
	}

	function canProceedStep1() {
		return (
			form.name.trim().length >= 2 &&
			/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
		);
	}

	function canProceedStep2() {
		return form.genres.length > 0;
	}

	async function handleSubmit() {
		setSubmitting(true);
		setError(null);

		try {
			// Insert library
			let library;
			try {
				library = await createLibraryAction({
					name: form.name.trim(),
					email: form.email.trim(),
					genres: form.genres,
					year_from: form.yearFrom,
					year_to: form.yearTo,
					frequency: form.frequency,
					day_of_week: form.frequency === "weekly" ? form.dayOfWeek : null,
				});
			} catch (e) {
				setError("No se pudo crear la biblioteca. Intentá de nuevo.");
				setSubmitting(false);
				return;
			}

			// Trigger first recommendation immediately (fire and forget is intentional)
			fetch("/api/recommend", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ libraryId: library.id }),
			}).catch(() => {
				// silently ignore; home page handles empty state gracefully
			});

			router.push("/");
		} catch {
			setError("Error inesperado. Intentá de nuevo.");
			setSubmitting(false);
		}
	}

	return (
		<>
			<style>{`
				.ob-root {
					min-height: 100dvh;
					background: #080808;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 2rem 1rem;
					font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
					color: #F5F0E8;
				}
				.ob-card {
					width: 100%;
					max-width: 520px;
					background: #111;
					border: 1px solid #1e1e1e;
					border-radius: 16px;
					padding: 2.5rem 2rem;
					display: flex;
					flex-direction: column;
					gap: 2rem;
				}
				.ob-logo {
					display: flex;
					align-items: center;
					gap: 0.6rem;
				}
				.ob-logo-emoji { font-size: 1.6rem; line-height: 1; }
				.ob-logo-text {
					font-family: var(--font-bebas-neue), 'Bebas Neue', cursive;
					font-size: 1.6rem;
					letter-spacing: 0.1em;
					color: #D4A853;
					line-height: 1;
				}
				.ob-progress {
					display: flex;
					gap: 0.4rem;
				}
				.ob-progress-bar {
					flex: 1;
					height: 3px;
					border-radius: 2px;
					background: #222;
					transition: background 0.3s ease;
				}
				.ob-progress-bar.active { background: #D4A853; }
				.ob-step-title {
					font-family: var(--font-bebas-neue), 'Bebas Neue', cursive;
					font-size: 2rem;
					letter-spacing: 0.05em;
					color: #F5F0E8;
					margin: 0 0 0.25rem;
					line-height: 1.1;
				}
				.ob-step-subtitle {
					font-size: 0.85rem;
					color: #666;
					margin: 0;
					line-height: 1.5;
				}
				.ob-field {
					display: flex;
					flex-direction: column;
					gap: 0.45rem;
				}
				.ob-label {
					font-size: 0.78rem;
					font-weight: 600;
					letter-spacing: 0.07em;
					text-transform: uppercase;
					color: #888;
				}
				.ob-input {
					background: #0d0d0d;
					border: 1px solid #2a2a2a;
					border-radius: 8px;
					padding: 0.7rem 0.9rem;
					font-size: 0.95rem;
					color: #F5F0E8;
					font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
					outline: none;
					transition: border-color 0.18s ease;
					width: 100%;
					box-sizing: border-box;
				}
				.ob-input:focus { border-color: #D4A853; }
				.ob-input::placeholder { color: #444; }
				.ob-genres {
					display: flex;
					flex-wrap: wrap;
					gap: 0.5rem;
				}
				.ob-genre-btn {
					font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
					font-size: 0.8rem;
					font-weight: 500;
					padding: 0.35rem 0.8rem;
					border-radius: 20px;
					border: 1px solid #2a2a2a;
					background: #0d0d0d;
					color: #888;
					cursor: pointer;
					transition: all 0.16s ease;
				}
				.ob-genre-btn:hover { border-color: #555; color: #F5F0E8; }
				.ob-genre-btn.selected {
					border-color: #D4A853;
					background: rgba(212, 168, 83, 0.1);
					color: #D4A853;
				}
				.ob-range-row {
					display: flex;
					gap: 0.75rem;
					align-items: center;
				}
				.ob-range-label {
					font-size: 0.78rem;
					color: #888;
					white-space: nowrap;
				}
				.ob-freq-options {
					display: flex;
					gap: 0.75rem;
				}
				.ob-freq-btn {
					flex: 1;
					font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
					font-size: 0.85rem;
					font-weight: 500;
					padding: 0.85rem 1rem;
					border-radius: 10px;
					border: 1px solid #2a2a2a;
					background: #0d0d0d;
					color: #888;
					cursor: pointer;
					transition: all 0.16s ease;
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 0.3rem;
				}
				.ob-freq-btn:hover { border-color: #555; color: #F5F0E8; }
				.ob-freq-btn.selected {
					border-color: #D4A853;
					background: rgba(212, 168, 83, 0.08);
					color: #D4A853;
				}
				.ob-freq-btn-emoji { font-size: 1.4rem; }
				.ob-freq-btn-sub { font-size: 0.7rem; color: #555; }
				.ob-freq-btn.selected .ob-freq-btn-sub { color: rgba(212,168,83,0.6); }
				.ob-actions {
					display: flex;
					gap: 0.75rem;
					justify-content: flex-end;
					padding-top: 0.5rem;
				}
				.ob-btn-secondary {
					font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
					font-size: 0.85rem;
					font-weight: 600;
					padding: 0.65rem 1.2rem;
					border-radius: 8px;
					border: 1px solid #2a2a2a;
					background: transparent;
					color: #888;
					cursor: pointer;
					transition: all 0.16s ease;
					letter-spacing: 0.03em;
				}
				.ob-btn-secondary:hover { border-color: #555; color: #F5F0E8; }
				.ob-btn-primary {
					font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
					font-size: 0.85rem;
					font-weight: 700;
					padding: 0.65rem 1.4rem;
					border-radius: 8px;
					border: none;
					background: #D4A853;
					color: #080808;
					cursor: pointer;
					letter-spacing: 0.04em;
					transition: background 0.16s ease, transform 0.12s ease;
				}
				.ob-btn-primary:hover:not(:disabled) {
					background: #e4bc6a;
					transform: translateY(-1px);
				}
				.ob-btn-primary:disabled {
					opacity: 0.45;
					cursor: not-allowed;
				}
				.ob-error {
					font-size: 0.78rem;
					color: #e57373;
					background: rgba(229,115,115,0.07);
					border: 1px solid rgba(229,115,115,0.2);
					border-radius: 6px;
					padding: 0.55rem 0.8rem;
				}
				.ob-summary-row {
					display: flex;
					justify-content: space-between;
					font-size: 0.85rem;
					padding: 0.4rem 0;
					border-bottom: 1px solid #1a1a1a;
					color: #aaa;
				}
				.ob-summary-row span:last-child { color: #F5F0E8; font-weight: 500; }
			`}</style>

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

					{/* ───────── STEP 1: Name + Email ───────── */}
					{step === 1 && (
						<>
							<div>
								<h1 className="ob-step-title">Creá tu biblioteca</h1>
								<p className="ob-step-subtitle">
									Te recomendaremos películas por email según tus gustos.
								</p>
							</div>

							<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
								<div className="ob-field">
									<label className="ob-label">Nombre de la biblioteca</label>
									<input
										className="ob-input"
										type="text"
										placeholder="Ej: Mi Cinemateca Personal"
										value={form.name}
										onChange={(e) =>
											setForm((prev) => ({ ...prev, name: e.target.value }))
										}
									/>
								</div>

								<div className="ob-field">
									<label className="ob-label">Email</label>
									<input
										className="ob-input"
										type="email"
										placeholder="tu@email.com"
										value={form.email}
										onChange={(e) =>
											setForm((prev) => ({ ...prev, email: e.target.value }))
										}
									/>
								</div>
							</div>

							<div className="ob-actions">
								<button
									type="button"
									className="ob-btn-primary"
									disabled={!canProceedStep1()}
									onClick={() => setStep(2)}
								>
									Siguiente →
								</button>
							</div>
						</>
					)}

					{/* ───────── STEP 2: Genres + Years ───────── */}
					{step === 2 && (
						<>
							<div>
								<h1 className="ob-step-title">Tus gustos</h1>
								<p className="ob-step-subtitle">
									Elegí al menos un género y el rango de años que te interesan.
								</p>
							</div>

							<div className="ob-field">
								<label className="ob-label">Géneros</label>
								<div className="ob-genres">
									{GENRES.map((g) => (
										<button
											type="button"
											key={g.id}
											className={`ob-genre-btn${form.genres.includes(g.id) ? " selected" : ""}`}
											onClick={() => toggleGenre(g.id)}
										>
											{g.label}
										</button>
									))}
								</div>
							</div>

							<div className="ob-field">
								<label className="ob-label">Rango de años</label>
								<div className="ob-range-row">
									<span className="ob-range-label">Desde</span>
									<input
										className="ob-input"
										type="number"
										min={1900}
										max={form.yearTo}
										value={form.yearFrom}
										onChange={(e) =>
											setForm((prev) => ({
												...prev,
												yearFrom: Number(e.target.value),
											}))
										}
										style={{ maxWidth: 100 }}
									/>
									<span className="ob-range-label">hasta</span>
									<input
										className="ob-input"
										type="number"
										min={form.yearFrom}
										max={CURRENT_YEAR}
										value={form.yearTo}
										onChange={(e) =>
											setForm((prev) => ({
												...prev,
												yearTo: Number(e.target.value),
											}))
										}
										style={{ maxWidth: 100 }}
									/>
								</div>
							</div>

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
									disabled={!canProceedStep2()}
									onClick={() => setStep(3)}
								>
									Siguiente →
								</button>
							</div>
						</>
					)}

					{/* ───────── STEP 3: Frequency + Confirm ───────── */}
					{step === 3 && (
						<>
							<div>
								<h1 className="ob-step-title">Frecuencia</h1>
								<p className="ob-step-subtitle">
									¿Con qué frecuencia querés recibir recomendaciones?
								</p>
							</div>

							<div className="ob-freq-options">
								<button
									type="button"
									className={`ob-freq-btn${form.frequency === "daily" ? " selected" : ""}`}
									onClick={() =>
										setForm((prev) => ({ ...prev, frequency: "daily" }))
									}
								>
									<span className="ob-freq-btn-emoji">📅</span>
									<span>Diaria</span>
									<span className="ob-freq-btn-sub">Cada día</span>
								</button>
								<button
									type="button"
									className={`ob-freq-btn${form.frequency === "weekly" ? " selected" : ""}`}
									onClick={() =>
										setForm((prev) => ({ ...prev, frequency: "weekly" }))
									}
								>
									<span className="ob-freq-btn-emoji">📆</span>
									<span>Semanal</span>
									<span className="ob-freq-btn-sub">Día a elección</span>
								</button>
							</div>

							{form.frequency === "weekly" && (
								<div className="ob-field" style={{ marginTop: "1rem" }}>
									<label className="ob-label">¿Qué día?</label>
									<div className="ob-genres">
										{DAYS.map((d) => (
											<button
												type="button"
												key={d.id}
												className={`ob-genre-btn${form.dayOfWeek === d.id ? " selected" : ""}`}
												onClick={() => setForm(prev => ({ ...prev, dayOfWeek: d.id }))}
											>
												{d.label}
											</button>
										))}
									</div>
								</div>
							)}

							{/* Summary */}
							<div>
								<div className="ob-summary-row">
									<span>Biblioteca</span>
									<span>{form.name}</span>
								</div>
								<div className="ob-summary-row">
									<span>Email</span>
									<span>{form.email}</span>
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
									<span>Frecuencia</span>
									<span>
										{form.frequency === "daily" 
                                            ? "Diaria" 
                                            : `Semanal (${DAYS.find(d => d.id === form.dayOfWeek)?.label})`}
									</span>
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
									{submitting ? "Creando…" : "🎬 Crear biblioteca"}
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</>
	);
}
