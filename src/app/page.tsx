import { MovieCard } from "@/components/movies/movies-card";
import { createClient } from "@/lib/supabase";
import type { Library, Recommendation } from "@/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import HomeActions from "./home-actions";

async function getLibrary(): Promise<Library | null> {
	const cookieStore = await cookies();
	const libraryId = cookieStore.get("cinerandom_library_id")?.value;

	if (!libraryId) {
		return null;
	}

	const supabase = createClient();
	const { data } = await supabase
		.from("libraries")
		.select("*")
		.eq("id", libraryId)
		.maybeSingle();

	return data ?? null;
}

async function getRecommendations(libraryId: string): Promise<Recommendation[]> {
	const supabase = createClient();
	const { data } = await supabase
		.from("recommendations")
		.select("*")
		.eq("library_id", libraryId)
		.order("recommended_at", { ascending: false });
	return data ?? [];
}

// TMDB genre id → display label
const GENRE_LABELS: Record<number, string> = {
	28: "Acción",
	12: "Aventura",
	16: "Animación",
	35: "Comedia",
	80: "Crimen",
	99: "Documental",
	18: "Drama",
	10751: "Familia",
	14: "Fantasía",
	36: "Historia",
	27: "Terror",
	10402: "Música",
	9648: "Misterio",
	10749: "Romance",
	878: "Ciencia ficción",
	10770: "TV Movie",
	53: "Suspenso",
	10752: "Bélica",
	37: "Western",
};

export default async function HomePage() {
	const library = await getLibrary();

	if (!library) {
		redirect("/onboarding");
	}

	let recommendations = await getRecommendations(library.id);

	if (recommendations.length === 0) {
		// No film yet? Trigger it on-the-fly
		try {
			// We use the absolute internal URL for server-side fetch
			await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/recommend`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ libraryId: library.id }),
			});
			// Refetch after generation
			recommendations = await getRecommendations(library.id);
		} catch (err) {
			console.error("Error auto-generating first recommendation:", err);
		}
	}

	return (
		<>
			<style>{`
				.cr-page {
					min-height: 100dvh;
					background: #080808;
					color: #F5F0E8;
					font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
				}
				.cr-header {
					border-bottom: 1px solid #1e1e1e;
					padding: 1.5rem 1.5rem 1.25rem;
					background: rgba(8, 8, 8, 0.9);
					backdrop-filter: blur(12px);
					position: sticky;
					top: 0;
					z-index: 20;
				}
				.cr-header-inner {
					max-width: 1400px;
					margin: 0 auto;
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 1rem;
					flex-wrap: wrap;
				}
				.cr-logo-row {
					display: flex;
					align-items: center;
					gap: 0.75rem;
				}
				.cr-logo-emoji {
					font-size: 1.5rem;
					line-height: 1;
				}
				.cr-logo-text {
					font-family: var(--font-bebas-neue), 'Bebas Neue', cursive;
					font-size: 1.5rem;
					letter-spacing: 0.1em;
					color: #D4A853;
					line-height: 1;
				}
				.cr-library-name {
					font-family: var(--font-bebas-neue), 'Bebas Neue', cursive;
					font-size: 2rem;
					letter-spacing: 0.05em;
					color: #F5F0E8;
					margin: 0;
					line-height: 1;
				}
				.cr-frequency-badge {
					display: inline-flex;
					align-items: center;
					gap: 0.3rem;
					font-size: 0.7rem;
					font-weight: 600;
					letter-spacing: 0.08em;
					text-transform: uppercase;
					color: #D4A853;
					background: rgba(212, 168, 83, 0.1);
					border: 1px solid rgba(212, 168, 83, 0.3);
					border-radius: 20px;
					padding: 0.25rem 0.65rem;
				}
				.cr-genres {
					display: flex;
					gap: 0.4rem;
					flex-wrap: wrap;
					margin-top: 0.5rem;
				}
				.cr-genre-tag {
					font-size: 0.68rem;
					color: #888;
					background: #1a1a1a;
					border: 1px solid #2a2a2a;
					border-radius: 4px;
					padding: 0.15rem 0.5rem;
				}
				.cr-main {
					max-width: 1400px;
					margin: 0 auto;
					padding: 2rem 1.5rem 4rem;
				}
				.cr-section-title {
					font-family: var(--font-bebas-neue), 'Bebas Neue', cursive;
					font-size: 1.1rem;
					letter-spacing: 0.12em;
					color: #555;
					margin: 0 0 1.25rem;
					text-transform: uppercase;
				}
				.cr-grid {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
					gap: 1rem;
				}
				@media (min-width: 640px) {
					.cr-grid {
						grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
					}
				}
				@media (min-width: 1024px) {
					.cr-grid {
						grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
					}
				}
				.cr-empty {
					grid-column: 1 / -1;
					display: flex;
					flex-direction: column;
					align-items: center;
					padding: 4rem 1rem;
					text-align: center;
					gap: 1rem;
				}
				.cr-empty-icon {
					font-size: 4rem;
					line-height: 1;
				}
				.cr-empty-title {
					font-family: var(--font-bebas-neue), 'Bebas Neue', cursive;
					font-size: 1.75rem;
					letter-spacing: 0.06em;
					color: #F5F0E8;
					margin: 0;
				}
				.cr-empty-text {
					color: #666;
					font-size: 0.9rem;
					max-width: 360px;
					line-height: 1.6;
					margin: 0;
				}
				@media (max-width: 640px) {
					.cr-header { padding: 1rem; }
					.cr-header-inner { flex-direction: column; align-items: flex-start; gap: 0.8rem; }
					.cr-main { padding: 1.5rem 1rem 3rem; }
				}
			`}</style>

			<div className="cr-page">
				<header className="cr-header">
					<div className="cr-header-inner">
						<div>
							<div className="cr-logo-row">
								<span className="cr-logo-emoji">🎬</span>
								<span className="cr-logo-text">CineRandom</span>
							</div>
							<h1 className="cr-library-name">{library.name}</h1>
							<div className="cr-genres">
								<span className="cr-frequency-badge">
									{library.frequency === "daily" ? "📅 Diaria" : "📆 Semanal"}
								</span>
								{library.genres.map((id) => (
									<span key={id} className="cr-genre-tag">
										{GENRE_LABELS[id] ?? `Género ${id}`}
									</span>
								))}
							</div>
						</div>

						<HomeActions
							libraryId={library.id}
							libraryEmail={library.email}
							receivesEmails={library.receives_emails}
						/>
					</div>
				</header>

				<main className="cr-main">
					<p className="cr-section-title">
						{recommendations.length > 0
							? `${recommendations.length} película${recommendations.length !== 1 ? "s" : ""} recomendada${recommendations.length !== 1 ? "s" : ""}`
							: "Tu biblioteca"}
					</p>

					<div className="cr-grid">
						{recommendations.length === 0 ? (
							<div className="cr-empty">
								<span className="cr-empty-icon">🍿</span>
								<h2 className="cr-empty-title">Tu primera recomendación está en camino</h2>
								<p className="cr-empty-text">
									Pronto recibirás tu primera película por email. ¿No podés
									esperar? Pedí una recomendación ahora con el botón de arriba.
								</p>
							</div>
						) : (
							recommendations.map((rec) => (
								<MovieCard key={rec.id} recommendation={rec} />
							))
						)}
					</div>
				</main>
			</div>
		</>
	);
}
