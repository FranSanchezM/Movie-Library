"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { getLibrariesByEmail, setLibraryCookie } from "../auth-actions";
import { deleteLibraryAction } from "../settings-actions";

function LoginContent() {
	const [email, setEmail] = useState("");
	const [libraries, setLibraries] = useState<{ id: string; name: string; frequency: string }[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
	const router = useRouter();
	const searchParams = useSearchParams();
	const urlEmail = searchParams.get("email");

	const handleSearch = useCallback(async (emailToSearch: string) => {
		setError(null);
		setLoading(true);

		try {
			const libs = await getLibrariesByEmail(emailToSearch);
			setLibraries(libs);
		} catch (err: any) {
			setError(err.message || "Error al iniciar sesión");
			setLibraries(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (urlEmail) {
			setEmail(urlEmail);
			handleSearch(urlEmail);
		}
	}, [urlEmail, handleSearch]);

	async function onFormSubmit(e: React.FormEvent) {
		e.preventDefault();
		handleSearch(email);
	}

	async function handleSelect(id: string) {
		setLoading(true);
		await setLibraryCookie(id);
		router.push("/");
	}

	async function handleDelete(id: string) {
		setLoading(true);
		setConfirmDelete(null);
		try {
			await deleteLibraryAction(id);
			// After deletion, re-fetch to update UI without full page reload if possible
			// or just let the server action's redirect handle the fresh state.
			const libs = await getLibrariesByEmail(email);
			setLibraries(libs);
		} catch (err: any) {
			setError(err.message || "Error al borrar");
		} finally {
			setLoading(false);
		}
	}


	return (
		<>
			<style>{`
				.login-root {
					min-height: 100dvh;
					background: #080808;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 2rem 1rem;
					font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
					color: #F5F0E8;
				}
				.login-card {
					width: 100%;
					max-width: 440px;
					background: #111;
					border: 1px solid #1e1e1e;
					border-radius: 16px;
					padding: 2.5rem 2rem;
					display: flex;
					flex-direction: column;
					gap: 2rem;
				}
				.login-logo {
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 0.6rem;
					margin-bottom: 0.5rem;
				}
				.login-logo-emoji { font-size: 2rem; line-height: 1; }
				.login-logo-text {
					font-family: var(--font-bebas-neue), 'Bebas Neue', cursive;
					font-size: 2rem;
					letter-spacing: 0.1em;
					color: #D4A853;
					line-height: 1;
				}
				.login-title {
					text-align: center;
					margin: 0;
					font-size: 1.25rem;
					font-weight: 600;
					color: #F5F0E8;
				}
				.login-subtitle {
					text-align: center;
					color: #888;
					font-size: 0.9rem;
					margin: 0.5rem 0 0;
				}
				.login-form {
					display: flex;
					flex-direction: column;
					gap: 1.25rem;
				}
				.login-input {
					background: #0d0d0d;
					border: 1px solid #2a2a2a;
					border-radius: 8px;
					padding: 0.85rem 1rem;
					font-size: 1rem;
					color: #F5F0E8;
					font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
					outline: none;
					transition: border-color 0.18s ease;
					width: 100%;
					box-sizing: border-box;
				}
				.login-input:focus { border-color: #D4A853; }
				.login-btn {
					font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
					font-size: 0.95rem;
					font-weight: 700;
					padding: 0.85rem 1.4rem;
					border-radius: 8px;
					border: none;
					background: #D4A853;
					color: #080808;
					cursor: pointer;
					letter-spacing: 0.04em;
					transition: background 0.16s ease, transform 0.12s ease;
					margin-top: 0.5rem;
				}
				.login-btn:hover:not(:disabled) {
					background: #e4bc6a;
					transform: translateY(-1px);
				}
				.login-btn:disabled {
					opacity: 0.45;
					cursor: not-allowed;
				}
				.login-error {
					font-size: 0.85rem;
					color: #e57373;
					background: rgba(229,115,115,0.07);
					border: 1px solid rgba(229,115,115,0.2);
					border-radius: 6px;
					padding: 0.75rem 1rem;
					text-align: center;
				}
				.login-footer {
					text-align: center;
					font-size: 0.85rem;
					color: #888;
				}
				.login-link {
					color: #D4A853;
					text-decoration: none;
					font-weight: 600;
					cursor: pointer;
				}
				.login-link:hover { text-decoration: underline; }
				
				.login-lib-btn {
					background: #1a1a1a;
					border: 1px solid #2a2a2a;
					border-radius: 8px;
					padding: 1rem;
					cursor: pointer;
					text-align: left;
					color: #F5F0E8;
					font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
					transition: all 0.2s;
					display: flex;
					flex-direction: column;
					gap: 0.25rem;
				}
				.login-lib-btn:hover { border-color: #D4A853; background: rgba(212,168,83,0.05); }
				.login-lib-name { font-size: 1.05rem; font-weight: 600; }
				.login-lib-meta { font-size: 0.8rem; color: #888; }
				.login-lib-row {
					display: flex;
					gap: 0.5rem;
					width: 100%;
				}
				.login-lib-delete {
					background: rgba(208,0,0,0.1);
					border: 1px solid rgba(208,0,0,0.2);
					color: #d00000;
					border-radius: 8px;
					width: 48px;
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;
					transition: all 0.2s;
					font-size: 1.2rem;
				}
				.login-lib-delete:hover {
					background: #d00000;
					color: #F5F0E8;
				}

				.modal-overlay {
					position: fixed;
					inset: 0;
					background: rgba(0,0,0,0.8);
					backdrop-filter: blur(4px);
					display: flex;
					align-items: center;
					justify-content: center;
					z-index: 100;
					padding: 1.5rem;
				}
				.modal-card {
					background: #121212;
					border: 1px solid #2a2a2a;
					padding: 2rem;
					border-radius: 16px;
					max-width: 400px;
					width: 100%;
					text-align: center;
					box-shadow: 0 20px 50px rgba(0,0,0,0.5);
				}
				.modal-title {
					font-family: var(--font-bebas-neue), 'Bebas Neue', cursive;
					font-size: 1.8rem;
					color: #F5F0E8;
					margin-bottom: 0.5rem;
				}
				.modal-text {
					color: #888;
					font-size: 0.95rem;
					margin-bottom: 2rem;
					line-height: 1.5;
				}
				.modal-actions {
					display: flex;
					gap: 0.75rem;
				}
				.modal-btn {
					flex: 1;
					padding: 0.75rem;
					border-radius: 8px;
					font-weight: 600;
					cursor: pointer;
					transition: all 0.2s;
				}
				.modal-btn-cancel {
					background: #1a1a1a;
					border: 1px solid #2a2a2a;
					color: #888;
				}
				.modal-btn-cancel:hover { color: #F5F0E8; border-color: #444; }
				.modal-btn-delete {
					background: #d00000;
					border: none;
					color: #F5F0E8;
				}
				.modal-btn-delete:hover { background: #ff1a1a; transform: translateY(-1px); }

				@media (max-width: 500px) {
					.login-card { padding: 1.75rem 1.25rem; }
					.login-title { font-size: 1.15rem; }
				}
			`}</style>
			
			<div className="login-root">
				<div className="login-card">
					<div>
						<div className="login-logo">
							<span className="login-logo-emoji">🎬</span>
							<span className="login-logo-text">CineRandom</span>
						</div>
						<h1 className="login-title">Iniciá sesión</h1>
						<p className="login-subtitle">
							Recuperá tu biblioteca ingresando tu email.
						</p>
					</div>

					{libraries === null ? (
						<form className="login-form" onSubmit={onFormSubmit}>
							<input
								type="email"
								placeholder="tu@email.com"
								className="login-input"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>

							{error && <div className="login-error">{error}</div>}

							<button type="submit" className="login-btn" disabled={loading || !email}>
								{loading ? "Buscando..." : "Buscar mis bibliotecas"}
							</button>
						</form>
					) : (
						<div className="login-form">
							<p style={{ margin: 0, color: "#888", fontSize: "0.9rem", textAlign: "center" }}>
								¿A qué biblioteca querés entrar?
							</p>
							{libraries.map((lib) => (
								<div key={lib.id} className="login-lib-row">
									<button 
										className="login-lib-btn" 
										style={{ flex: 1 }}
										onClick={() => handleSelect(lib.id)} 
										disabled={loading}
									>
										<span className="login-lib-name">{lib.name}</span>
										<span className="login-lib-meta">Recomendación {lib.frequency === "daily" ? "Diaria" : "Semanal"}</span>
									</button>
									<button 
										className="login-lib-delete"
										onClick={(e) => {
											e.stopPropagation();
											setConfirmDelete({ id: lib.id, name: lib.name });
										}}
										disabled={loading}
										title="Borrar biblioteca"
									>
										🗑
									</button>
								</div>
							))}
							<button 
								className="login-lib-btn" 
								style={{ borderStyle: "dashed", borderColor: "rgba(212,168,83,0.3)", alignItems: "center", justifyContent: "center", color: "#D4A853" }}
								onClick={() => router.push("/onboarding")}
								disabled={loading}
							>
								<span className="login-lib-name">+ Crear nueva biblioteca</span>
							</button>
							<button 
								onClick={() => setLibraries(null)} 
								style={{ background: "none", border: "none", color: "#D4A853", cursor: "pointer", marginTop: "0.5rem" }}
							>
								← Usar otro email
							</button>
						</div>
					)}


					<div className="login-footer">
						¿No tenés una cuenta?{" "}
						<button onClick={() => router.push("/onboarding")} className="login-link" style={{ background: 'none', border: 'none', padding: 0, font: 'inherit' }}>
							Crear una
						</button>
					</div>
				</div>
			</div>

			{confirmDelete && (
				<div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
					<div className="modal-card" onClick={e => e.stopPropagation()}>
						<h3 className="modal-title">¿Borrar biblioteca?</h3>
						<p className="modal-text">
							Estás por eliminar <strong>"{confirmDelete.name}"</strong>. 
							Esta acción no se puede deshacer y perderás todas tus recomendaciones.
						</p>
						<div className="modal-actions">
							<button className="modal-btn modal-btn-cancel" onClick={() => setConfirmDelete(null)}>
								Cancelar
							</button>
							<button className="modal-btn modal-btn-delete" onClick={() => handleDelete(confirmDelete.id)}>
								Sí, borrar
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

export default function LoginPage() {
	return (
		<Suspense fallback={<div style={{ minHeight: "100dvh", background: "#080808" }} />}>
			<LoginContent />
		</Suspense>
	);
}
