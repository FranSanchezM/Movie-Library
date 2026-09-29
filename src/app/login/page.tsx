import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { signInWithGoogleAction } from "../auth-actions";

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string }>;
}) {
	const { error } = await searchParams;

	// A session without a profile lands here with ?error: do not loop back.
	if (!error && (await getCurrentUser())) {
		redirect("/");
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
					width: 100%;
					transition: background 0.16s ease, transform 0.12s ease;
				}
				.login-btn:hover {
					background: #e4bc6a;
					transform: translateY(-1px);
				}
				.login-error {
					font-size: 0.85rem;
					color: #e57373;
					background: rgba(229,115,115,0.07);
					border: 1px solid rgba(229,115,115,0.2);
					border-radius: 6px;
					padding: 0.75rem 1rem;
					text-align: center;
					margin: 0;
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
						<p className="login-subtitle">Entra con tu cuenta de Google.</p>
					</div>

					{error && (
						<p className="login-error">
							No pudimos iniciar sesión. Intentá de nuevo.
						</p>
					)}

					<form action={signInWithGoogleAction}>
						<button type="submit" className="login-btn">
							Continuar con Google
						</button>
					</form>
				</div>
			</div>
		</>
	);
}
