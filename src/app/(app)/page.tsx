import { SECTIONS, isMediaType } from "@/config/media";
import type { Section } from "@/config/media";
import { deliveryDayLabel, getCurrentYear } from "@/lib/profile-options";
import { getCurrentPreferences, getCurrentProfile } from "@/lib/session";
import { createUserClient } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";

// Legacy dashboard URLs (?mode=series) -> /series
const LEGACY_MODE: Record<string, string> = {
	series: "series",
	peliculas: "peliculas",
};

export default async function HomePage({
	searchParams,
}: {
	searchParams: Promise<{ mode?: string; year?: string }>;
}) {
	const { mode, year } = await searchParams;
	if (mode && LEGACY_MODE[mode]) {
		redirect(
			`/${LEGACY_MODE[mode]}${year ? `?year=${encodeURIComponent(year)}` : ""}`,
		);
	}

	const profile = await getCurrentProfile();
	if (!profile) redirect("/login");

	const supabase = await createUserClient();
	const preferences = await getCurrentPreferences();
	const currentYear = getCurrentYear();

	// Recommendation counts per media type (this year / all time)
	const { data: recs } = await supabase
		.from("recommendations")
		.select("media_type, libraries!inner(year)")
		.eq("profile_id", profile.id);

	const stats: Record<string, { year: number; total: number }> = {};
	for (const r of (recs ?? []) as unknown as {
		media_type: string;
		libraries: { year: number } | { year: number }[];
	}[]) {
		const lib = Array.isArray(r.libraries) ? r.libraries[0] : r.libraries;
		const s = stats[r.media_type] ?? { year: 0, total: 0 };
		stats[r.media_type] = s;
		s.total += 1;
		if (lib?.year === currentYear) s.year += 1;
	}

	function status(section: Section) {
		if (!section.available)
			return { label: "Pronto", detail: "En preparación" };
		if (!isMediaType(section.id)) return { label: "Pronto", detail: "" };
		const enabled = preferences.some(
			(p) => p.media_type === section.id && p.enabled,
		);
		if (!enabled)
			return { label: "Sin biblioteca", detail: "Crea la tuya en un minuto" };
		const s = stats[section.id] ?? { year: 0, total: 0 };
		return {
			label: `${s.year} en ${currentYear}`,
			detail: `${s.total} en total`,
		};
	}

	return (
		<div className="hm-wrap">
			<style>{`
				.hm-wrap { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem 4rem; font-family: var(--font-dm-sans), 'DM Sans', sans-serif; }
				.hm-title { font-family: var(--font-bebas-neue), 'Bebas Neue', cursive; font-size: 2.6rem; letter-spacing: 0.04em; margin: 0; color: #F5F0E8; line-height: 1.05; }
				.hm-sub { color: #888; margin: 0.5rem 0 2rem; font-size: 0.95rem; }
				.hm-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
				.hm-card { position: relative; display: flex; flex-direction: column; gap: 0.75rem; padding: 1.25rem; border-radius: var(--m-radius); border: 1px solid var(--m-border); background: #111; background-image: radial-gradient(420px 160px at 0% 0%, var(--m-glow), transparent 70%); text-decoration: none; color: inherit; transition: transform 0.2s ease, box-shadow 0.2s ease; overflow: hidden; }
				a.hm-card:hover { transform: translateY(-3px); box-shadow: 0 10px 30px var(--m-glow); }
				.hm-card.muted { opacity: 0.55; border-style: dashed; background-image: none; }
				.hm-card-top { display: flex; align-items: center; justify-content: space-between; }
				.hm-icon { display: flex; align-items: center; justify-content: center; width: 2.75rem; height: 2.75rem; border-radius: 12px; font-size: 1.5rem; background: var(--m-gradient); }
				.hm-pill { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--m-accent); background: var(--m-soft); border: 1px solid var(--m-border); border-radius: 20px; padding: 0.2rem 0.6rem; }
				.hm-name { font-family: var(--m-title-font); letter-spacing: var(--m-title-tracking); text-transform: var(--m-title-transform); font-size: 1.7rem; margin: 0; color: #F5F0E8; }
				.hm-tag { color: #999; font-size: 0.85rem; margin: 0; line-height: 1.5; }
				.hm-detail { color: #777; font-size: 0.78rem; margin: 0; }
				.hm-cta { margin-top: auto; font-size: 0.85rem; font-weight: 700; color: var(--m-accent); }
				@media (max-width: 640px) { .hm-wrap { padding: 1.5rem 1rem 3rem; } .hm-title { font-size: 2.1rem; } }
			`}</style>

			<h1 className="hm-title">Hola, {profile.name}</h1>
			<p className="hm-sub">
				Tus recomendaciones semanales llegan los{" "}
				{deliveryDayLabel(profile.day_of_week, true).toLowerCase()}. Elige una
				sección para empezar.
			</p>

			<div className="hm-grid">
				{SECTIONS.map((section) => {
					const st = status(section);
					const hasLibrary =
						section.available &&
						preferences.some((p) => p.media_type === section.id && p.enabled);
					return section.available ? (
						<Link
							key={section.slug}
							href={`/${section.slug}`}
							data-media={section.slug}
							className="hm-card"
						>
							<CardBody section={section} st={st} hasLibrary={hasLibrary} />
						</Link>
					) : (
						<div
							key={section.slug}
							data-media={section.slug}
							className="hm-card muted"
							aria-disabled="true"
						>
							<CardBody section={section} st={st} hasLibrary={hasLibrary} />
						</div>
					);
				})}
			</div>
		</div>
	);
}

function CardBody({
	section,
	st,
	hasLibrary,
}: {
	section: Section;
	st: { label: string; detail: string };
	hasLibrary: boolean;
}) {
	return (
		<>
			<div className="hm-card-top">
				<span className="hm-icon" aria-hidden="true">
					{section.icon}
				</span>
				<span className="hm-pill">{st.label}</span>
			</div>
			<h2 className="hm-name">{section.label}</h2>
			<p className="hm-tag">{section.tagline}</p>
			{st.detail && <p className="hm-detail">{st.detail}</p>}
			{section.available && (
				<span className="hm-cta">
					{hasLibrary ? "Abrir →" : "Crear biblioteca →"}
				</span>
			)}
		</>
	);
}
