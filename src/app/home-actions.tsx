"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "./auth-actions";

interface Props {
	libraryId: string;
}

export default function HomeActions({ libraryId }: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

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
			`}</style>
			<div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
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
					onClick={() => logoutAction()} 
					className="cr-logout-btn"
					title="Cerrar sesión"
				>
					Salir
				</button>
			</div>
		</>
	);
}
