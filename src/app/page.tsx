import { MovieCard } from "@/components/movies/movies-card";
import {
	GENRE_LABELS,
	deliveryDayLabel,
	getCurrentYear,
} from "@/lib/profile-options";
import { createRecommendationForProfile } from "@/lib/recommendations";
import { getCurrentProfile, getCurrentUser } from "@/lib/session";
import { createUserClient } from "@/lib/supabase-server";
import type { Library, Recommendation } from "@/types";
import Link from "next/link";
import { redirect } from "next/navigation";
import HomeActions from "./home-actions";

type UserClient = Awaited<ReturnType<typeof createUserClient>>;

async function getLibraries(
	supabase: UserClient,
	profileId: string,
): Promise<Library[]> {
	const { data } = await supabase
		.from("libraries")
		.select("*")
		.eq("profile_id", profileId)
		.order("year", { ascending: false });
	return (data ?? []) as Library[];
}

async function getRecommendations(
	supabase: UserClient,
	libraryId: string,
): Promise<Recommendation[]> {
	const { data } = await supabase
		.from("recommendations")
		.select("*")
		.eq("library_id", libraryId)
		.order("recommended_at", { ascending: false });
	return (data ?? []) as Recommendation[];
}

async function countRecommendations(
	supabase: UserClient,
	profileId: string,
): Promise<number> {
	const { count } = await supabase
		.from("recommendations")
		.select("id", { count: "exact", head: true })
		.eq("profile_id", profileId);
	return count ?? 0;
}

export default async function HomePage({
	searchParams,
}: {
	searchParams: Promise<{ year?: string }>;
}) {
	const profile = await getCurrentProfile();

	if (!profile) {
		redirect((await getCurrentUser()) ? "/onboarding" : "/login");
	}

	const supabase = await createUserClient();
	const currentYear = getCurrentYear();

	if ((await countRecommendations(supabase, profile.id)) === 0) {
		// No film yet? Generate it on-the-fly
		try {
			await createRecommendationForProfile(supabase, profile.id);
		} catch (err) {
			console.error("Error auto-generating first recommendation:", err);
		}
	}

	const libraries = await getLibraries(supabase, profile.id);

	// Year selector: every existing year plus the current one (created lazily)
	const years = [
		...new Set([currentYear, ...libraries.map((l) => l.year)]),
	].sort((a, b) => b - a);
	const { year: yearParam } = await searchParams;
	const requestedYear = Number(yearParam);
	const selectedYear = years.includes(requestedYear)
		? requestedYear
		: currentYear;
	const library = libraries.find((l) => l.year === selectedYear) ?? null;
	const recommendations = library
		? await getRecommendations(supabase, library.id)
		: [];

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
				.cr-toolbar {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 1rem;
					flex-wrap: wrap;
					margin-bottom: 1.25rem;
				}
				.cr-years {
					display: flex;
					gap: 0.4rem;
					flex-wrap: wrap;
				}
				.cr-year-link {
					font-size: 0.78rem;
					font-weight: 600;
					color: #888;
					text-decoration: none;
					border: 1px solid #2a2a2a;
					border-radius: 20px;
					padding: 0.3rem 0.8rem;
					transition: all 0.16s ease;
				}
				.cr-year-link:hover { border-color: #555; color: #F5F0E8; }
				.cr-year-link.active {
					color: #D4A853;
					border-color: #D4A853;
					background: rgba(212, 168, 83, 0.1);
				}
				.cr-export {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					font-size: 0.72rem;
					color: #666;
				}
				.cr-export a {
					color: #D4A853;
					text-decoration: none;
					font-weight: 600;
					border: 1px solid rgba(212, 168, 83, 0.3);
					border-radius: 6px;
					padding: 0.25rem 0.6rem;
				}
				.cr-export a:hover { background: rgba(212, 168, 83, 0.12); }
				.cr-section-title {
					font-family: var(--font-bebas-neue), 'Bebas Neue', cursive;
					font-size: 1.1rem;
					letter-spacing: 0.12em;
					color: #555;
					margin: 0;
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
							<h1 className="cr-library-name">{profile.name}</h1>
							<div className="cr-genres">
								<span className="cr-frequency-badge">
									📆 {deliveryDayLabel(profile.day_of_week, true)}
								</span>
								{profile.genres.map((id) => (
									<span key={id} className="cr-genre-tag">
										{GENRE_LABELS[id] ?? `Género ${id}`}
									</span>
								))}
							</div>
						</div>

						<HomeActions receivesEmails={profile.receives_emails} />
					</div>
				</header>

				<main className="cr-main">
					<div className="cr-toolbar">
						<nav className="cr-years" aria-label="Bibliotecas por año">
							{years.map((y) => (
								<Link
									key={y}
									href={y === currentYear ? "/" : `/?year=${y}`}
									className={`cr-year-link${y === selectedYear ? " active" : ""}`}
								>
									Biblioteca {y}
								</Link>
							))}
						</nav>

						{library && recommendations.length > 0 && (
							<div className="cr-export">
								<span>Respaldar {selectedYear}:</span>
								<a
									href={`/api/libraries/${library.id}/export?format=json`}
									download
								>
									JSON
								</a>
								<a
									href={`/api/libraries/${library.id}/export?format=csv`}
									download
								>
									CSV
								</a>
							</div>
						)}
					</div>

					<p className="cr-section-title" style={{ marginBottom: "1.25rem" }}>
						{recommendations.length > 0
							? `${recommendations.length} película${recommendations.length !== 1 ? "s" : ""} recomendada${recommendations.length !== 1 ? "s" : ""} en ${selectedYear}`
							: `Biblioteca ${selectedYear}`}
					</p>

					<div className="cr-grid">
						{recommendations.length === 0 ? (
							<div className="cr-empty">
								<span className="cr-empty-icon">🍿</span>
								<h2 className="cr-empty-title">
									{selectedYear === currentYear
										? "Tu próxima recomendación está en camino"
										: `No hay recomendaciones en ${selectedYear}`}
								</h2>
								{selectedYear === currentYear && (
									<p className="cr-empty-text">
										Pronto recibirás tu próxima película. ¿No querés esperar?
										Usá el botón «Nueva recomendación».
									</p>
								)}
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
