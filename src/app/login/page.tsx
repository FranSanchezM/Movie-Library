"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginAction } from "../auth-actions";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			await loginAction(email);
			// loginAction will redirect on success
		} catch (err: any) {
			setError(err.message || "Error al iniciar sesión");
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

					<form className="login-form" onSubmit={handleSubmit}>
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
							{loading ? "Entrando..." : "Entrar a mi biblioteca"}
						</button>
					</form>

					<div className="login-footer">
						¿No tenés una cuenta?{" "}
						<button onClick={() => router.push("/onboarding")} className="login-link" style={{ background: 'none', border: 'none', padding: 0, font: 'inherit' }}>
							Crear una
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
