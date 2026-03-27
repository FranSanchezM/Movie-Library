"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "./auth-actions";
import { updateLibrarySettings, deleteLibraryAction } from "./settings-actions";

interface Props {
	libraryId: string;
	libraryEmail: string;
	receivesEmails: boolean;
}

export default function HomeActions({ libraryId, libraryEmail, receivesEmails }: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [emailOn, setEmailOn] = useState(receivesEmails);

	async function handleToggleEmail() {
		const nextState = !emailOn;
		setEmailOn(nextState);
		try {
			await updateLibrarySettings(libraryId, { receives_emails: nextState });
		} catch {
			setEmailOn(emailOn); // rollback
		}
	}

	async function handleSwitchLibrary() {
		setLoading(true);
		router.push(`/login?email=${encodeURIComponent(libraryEmail)}`);
	}

	async function handleRecommend() {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/recommend", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ libraryId }),
			});
			if (!res.ok) {
				const data = await res.json();
				setError(data.error ?? "Error al obtener recomendación");
			} else {
				router.refresh();
			}
		} catch {
			setError("Error de conexión. Intentá de nuevo.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<style>{`
				.cr-recommend-btn {
					display: inline-flex;
					align-items: center;
					gap: 0.45rem;
					font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
					font-size: 0.82rem;
					font-weight: 600;
					letter-spacing: 0.05em;
					text-transform: uppercase;
					color: #080808;
					background: #D4A853;
					border: none;
					border-radius: 8px;
					padding: 0.6rem 1.1rem;
					cursor: pointer;
					transition: background 0.18s ease, transform 0.15s ease;
					white-space: nowrap;
				}
				.cr-recommend-btn:hover:not(:disabled) {
					background: #e4bc6a;
					transform: translateY(-1px);
				}
				.cr-recommend-btn:active:not(:disabled) {
					transform: translateY(0);
				}
				.cr-recommend-btn:disabled {
					opacity: 0.6;
					cursor: not-allowed;
				}
				.cr-actions-error {
					font-size: 0.75rem;
					color: #e57373;
					margin: 0;
					text-align: right;
				}
				.cr-logout-btn {
					display: inline-flex;
					align-items: center;
					gap: 0.45rem;
					font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
					font-size: 0.82rem;
					font-weight: 600;
					letter-spacing: 0.05em;
					text-transform: uppercase;
					color: #888;
					background: transparent;
					border: 1px solid #2a2a2a;
					border-radius: 8px;
					padding: 0.6rem 1.1rem;
					cursor: pointer;
					transition: all 0.18s ease;
					white-space: nowrap;
					height: 100%;
				}
				.cr-logout-btn:hover {
					color: #F5F0E8;
					border-color: #555;
				}
				.cr-action-small-btn {
					background: transparent;
					border: 1px solid #2a2a2a;
					color: #888;
					border-radius: 8px;
					padding: 0.6rem;
					cursor: pointer;
					transition: all 0.18s ease;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				.cr-action-small-btn:hover {
					color: #F5F0E8;
					border-color: #555;
				}
				.cr-action-small-btn.delete:hover {
					color: #d00000;
					border-color: #d00000;
					background: rgba(208,0,0,0.1);
				}
			`}</style>
			<div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", flexWrap: "wrap", justifyContent: "flex-end" }}>
				<div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-end" }}>
					<button
						type="button"
						onClick={handleRecommend}
						disabled={loading}
						className="cr-recommend-btn"
					>
						{loading ? "Buscando..." : "🍿 Pedir recomendación ahora"}
					</button>
					{error && <p className="cr-actions-error">{error}</p>}
				</div>

				<button 
					type="button" 
					onClick={handleToggleEmail} 
					className="cr-action-small-btn"
					disabled={loading}
					title={emailOn ? "Emails activados. Tocar para apagar" : "Emails apagados. Tocar para prender"}
				>
					{emailOn ? "🔔" : "🔕"}
				</button>

				<button 
					type="button" 
					onClick={handleSwitchLibrary} 
					className="cr-logout-btn"
					disabled={loading}
					title="Ver todas mis bibliotecas"
					style={{ color: "#D4A853", borderColor: "rgba(212,168,83,0.3)" }}
				>
					Mis Bibliotecas
				</button>

				<button 
					type="button" 
					onClick={() => logoutAction()} 
					className="cr-logout-btn"
					disabled={loading}
					title="Cambiar de cuenta o salir"
				>
					Salir
				</button>
			</div>
		</>
	);
}
