"use client";

import type { MediaType } from "@/config/media";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** "Nueva recomendación" for the section it is rendered in. */
export function RecommendButton({
	mediaType,
	year,
}: {
	mediaType: MediaType;
	/** Year currently shown; the request lands in the current year's library */
	year?: number | null;
}) {
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
				body: JSON.stringify({ mediaType }),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => null);
				setError(data?.error ?? "No se pudo obtener");
			} else {
				if (year) router.push(window.location.pathname);
				router.refresh();
			}
		} catch {
			setError("Error de conexión.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
			<button
				type="button"
				onClick={handleRecommend}
				disabled={loading}
				className="m-btn"
			>
				{loading ? "Buscando…" : "🍿 Nueva recomendación"}
			</button>
			{error && (
				<p style={{ fontSize: "0.75rem", color: "#e57373", margin: 0 }}>
					{error}
				</p>
			)}
		</div>
	);
}
