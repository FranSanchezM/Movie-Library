import { Inngest } from "inngest";
import { sendMovieEmail } from "./email";
import { getMovieForLibrary } from "./movies";
import { createClient } from "./supabase";

export const inngest = new Inngest({ id: "movie-library" });
// Helper: process a single library — fetch movie, save, and send email
async function processLibrary(libraryId: string) {
	const supabase = createClient();

	// Get library details
	const { data: library, error } = await supabase
		.from("libraries")
		.select("*")
		.eq("id", libraryId)
		.single();

	if (error || !library) {
		console.error(`Library ${libraryId} not found`);
		return;
	}

	// Get already recommended tmdb_ids to avoid repeats
	const { data: existing } = await supabase
		.from("recommendations")
		.select("tmdb_id")
		.eq("library_id", libraryId);

	const excludeIds = (existing ?? []).map(
		(r: { tmdb_id: number }) => r.tmdb_id,
	);

	// Fetch a movie matching this library's filters
	const movie = await getMovieForLibrary(
		library.genres,
		library.year_from,
		library.year_to,
		excludeIds,
	);

	if (!movie) {
		console.error(`No movie found for library ${libraryId}`);
		return;
	}

	// Save recommendation to Supabase
	const { error: insertError } = await supabase.from("recommendations").insert({
		library_id: libraryId,
		tmdb_id: movie.tmdbId,
		imdb_id: movie.imdbId,
		title: movie.title,
		slug: movie.letterboxdUrl,
		poster_path: movie.posterUrl,
		description: movie.description,
		release_year: movie.releaseYear,
		tmdb_rating: movie.tmdbRating,
		imdb_rating: movie.imdbRating,
		rt_rating: movie.rtRating,
	});

	if (insertError) {
		console.error("Error saving recommendation:", insertError);
		return;
	}

	// Send email via shared helper
	await sendMovieEmail(library.email, library.name, library.frequency, movie);
}

// ─────────────────────────────────────────────
// CRON: Daily — runs every day at 9am UTC
// ─────────────────────────────────────────────
export const dailyRecommendation = inngest.createFunction(
	{
		id: "daily-recommendation",
		triggers: [{ cron: "0 9 * * *" }],
	},
	async ({ step }) => {
		const supabase = createClient();

		const { data: libraries } = await supabase
			.from("libraries")
			.select("id")
			.eq("frequency", "daily");

		for (const lib of libraries ?? []) {
			await step.run(`process-library-${lib.id}`, () => processLibrary(lib.id));
		}

		return { processed: libraries?.length ?? 0 };
	},
);

// ─────────────────────────────────────────────
// CRON: Weekly — runs every day at 9am UTC but filters by user's day
// ─────────────────────────────────────────────
export const weeklyRecommendation = inngest.createFunction(
	{
		id: "weekly-recommendation",
		triggers: [{ cron: "0 9 * * *" }],
	},
	async ({ step }) => {
		const supabase = createClient();
		const today = new Date().getDay();

		const { data: libraries } = await supabase
			.from("libraries")
			.select("id")
			.eq("frequency", "weekly")
			.eq("day_of_week", today);

		for (const lib of libraries ?? []) {
			await step.run(`process-library-${lib.id}`, () => processLibrary(lib.id));
		}

		return { processed: libraries?.length ?? 0 };
	},
);
