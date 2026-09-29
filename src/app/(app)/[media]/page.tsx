import { CreateLibrary } from "@/components/media/create-library";
import { MediaCard } from "@/components/media/media-card";
import { RecommendButton } from "@/components/media/recommend-button";
import {
	type MediaType,
	genreLabels,
	getSectionBySlug,
	sectionHref,
} from "@/config/media";
import { deliveryDayLabel, getCurrentYear } from "@/lib/profile-options";
import { getCurrentPreferences, getCurrentProfile } from "@/lib/session";
import { createUserClient } from "@/lib/supabase-server";
import type { Library, Recommendation } from "@/types";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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
	mediaType: MediaType,
): Promise<Recommendation[]> {
	const { data } = await supabase
		.from("recommendations")
		.select("*")
		.eq("library_id", libraryId)
		.eq("media_type", mediaType)
		.order("recommended_at", { ascending: false });
	return (data ?? []) as Recommendation[];
}

export default async function MediaSectionPage({
	params,
	searchParams,
}: {
	params: Promise<{ media: string }>;
	searchParams: Promise<{ year?: string }>;
}) {
	const { media } = await params;
	const section = getSectionBySlug(media);
	if (!section) notFound();

	// Planned sections: a simple coming-soon view
	if (!section.available) {
		return (
			<div className="cr-wrap">
				<SectionStyles />
				<div className="cr-empty">
					<span className="cr-empty-icon">{section.icon}</span>
					<h1 className="cr-empty-title m-title">
						{section.label}: próximamente
					</h1>
					<p className="cr-empty-text">
						Estamos preparando esta sección. Mientras tanto, prueba{" "}
						<Link href="/peliculas" className="cr-link">
							Películas
						</Link>{" "}
						o{" "}
						<Link href="/series" className="cr-link">
							Series
						</Link>
						.
					</p>
				</div>
			</div>
		);
	}

	const mediaType = section.id;
	const profile = await getCurrentProfile();
	if (!profile) redirect("/login");

	const preferences = await getCurrentPreferences();
	const prefs = preferences.find((p) => p.media_type === mediaType);

	// No library yet (no preferences row, or disabled): invite to create it
	if (!prefs?.enabled) {
		return (
			<div className="cr-wrap">
				<SectionStyles />
				<h1 className="cr-h1 m-title">{section.label}</h1>
				<CreateLibrary
					mediaType={mediaType}
					country={profile.country}
					language={profile.language}
				/>
			</div>
		);
	}

	const supabase = await createUserClient();
	const currentYear = getCurrentYear();
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
		? await getRecommendations(supabase, library.id, mediaType)
		: [];
	const labels = genreLabels(mediaType);
	const count = recommendations.length;

	return (
		<div className="cr-wrap">
			<SectionStyles />

			<header className="cr-head">
				<div>
					<h1 className="cr-h1 m-title">
						<span aria-hidden="true">{section.icon}</span> {section.label}
					</h1>
					<div className="cr-tags">
						<span className="cr-badge">
							📆 {deliveryDayLabel(profile.day_of_week, true)}
						</span>
						{prefs.genres.map((id) => (
							<span key={id} className="cr-tag">
								{labels[id] ?? `Género ${id}`}
							</span>
						))}
					</div>
				</div>
				<RecommendButton
					mediaType={mediaType}
					year={yearParam ? selectedYear : null}
				/>
			</header>

			<div className="cr-toolbar">
				<nav className="cr-years" aria-label="Bibliotecas por año">
					{years.map((y) => (
						<Link
							key={y}
							href={sectionHref(mediaType, y === currentYear ? null : y)}
							className={`cr-year${y === selectedYear ? " active" : ""}`}
						>
							Biblioteca {y}
						</Link>
					))}
				</nav>

				{library && count > 0 && (
					<div className="cr-export">
						<span>
							Respaldar {section.label.toLowerCase()} {selectedYear}:
						</span>
						<a
							href={`/api/libraries/${library.id}/export?format=json&media_type=${mediaType}`}
							download
						>
							JSON
						</a>
						<a
							href={`/api/libraries/${library.id}/export?format=csv&media_type=${mediaType}`}
							download
						>
							CSV
						</a>
					</div>
				)}
			</div>

			<p className="cr-count">
				{count > 0
					? `${count} ${count === 1 ? section.singular.toLowerCase() : section.label.toLowerCase()} ${count === 1 ? "recomendada" : "recomendadas"} en ${selectedYear}`
					: `Biblioteca ${selectedYear} · ${section.label}`}
			</p>

			<div className="cr-grid">
				{count === 0 ? (
					<div className="cr-empty">
						<span className="cr-empty-icon">{section.icon}</span>
						<h2 className="cr-empty-title m-title">
							{selectedYear === currentYear
								? "Tu próxima recomendación está en camino"
								: `No hay ${section.label.toLowerCase()} en ${selectedYear}`}
						</h2>
						{selectedYear === currentYear && (
							<p className="cr-empty-text">
								Pronto recibirás tu próxima recomendación. ¿No quieres esperar?
								Usa «Nueva recomendación».
							</p>
						)}
					</div>
				) : (
					recommendations.map((rec) => (
						<MediaCard key={rec.id} recommendation={rec} />
					))
				)}
			</div>
		</div>
	);
}

// Layout styles for section pages. Colors come from the --m-* theme variables.
function SectionStyles() {
	return (
		<style>{`
			.cr-wrap { max-width: 1400px; margin: 0 auto; padding: 2rem 1.5rem 4rem; font-family: var(--font-dm-sans), 'DM Sans', sans-serif; }
			.cr-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
			.cr-h1 { font-size: 2.4rem; margin: 0 0 0.5rem; line-height: 1; color: #F5F0E8; }
			.cr-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; }
			.cr-badge { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--m-accent); background: var(--m-soft); border: 1px solid var(--m-border); border-radius: 20px; padding: 0.25rem 0.65rem; }
			.cr-tag { font-size: 0.68rem; color: #999; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 4px; padding: 0.15rem 0.5rem; }
			.cr-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
			.cr-years { display: flex; gap: 0.4rem; flex-wrap: wrap; }
			.cr-year { font-size: 0.78rem; font-weight: 600; color: #999; text-decoration: none; border: 1px solid #2a2a2a; border-radius: 20px; padding: 0.3rem 0.8rem; transition: all 0.16s ease; }
			.cr-year:hover { border-color: #555; color: #F5F0E8; }
			.cr-year.active { color: var(--m-accent); border-color: var(--m-accent); background: var(--m-soft); }
			.cr-export { display: flex; align-items: center; gap: 0.5rem; font-size: 0.72rem; color: #888; }
			.cr-export a { color: var(--m-accent); text-decoration: none; font-weight: 600; border: 1px solid var(--m-border); border-radius: 6px; padding: 0.25rem 0.6rem; }
			.cr-export a:hover { background: var(--m-soft); }
			.cr-count { font-size: 0.85rem; letter-spacing: 0.1em; text-transform: uppercase; color: #777; margin: 0 0 1.25rem; }
			.cr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
			@media (min-width: 640px) { .cr-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); } }
			@media (min-width: 1024px) { .cr-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); } }
			.cr-empty { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; padding: 4rem 1rem; text-align: center; gap: 1rem; }
			.cr-empty-icon { font-size: 4rem; line-height: 1; }
			.cr-empty-title { font-size: 1.75rem; color: #F5F0E8; margin: 0; }
			.cr-empty-text { color: #888; font-size: 0.9rem; max-width: 380px; line-height: 1.6; margin: 0; }
			.cr-link { color: var(--m-accent); font-weight: 600; }
			@media (max-width: 640px) { .cr-wrap { padding: 1.5rem 1rem 3rem; } .cr-h1 { font-size: 2rem; } }
		`}</style>
	);
}
