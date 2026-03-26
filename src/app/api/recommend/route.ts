import { sendMovieEmail } from "@/lib/email";
import { getMovieForLibrary } from "@/lib/movies";
import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	let body: { libraryId?: string };

	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const { libraryId } = body;

	if (!libraryId) {
		return NextResponse.json(
			{ error: "libraryId is required" },
			{ status: 400 },
		);
	}

	const supabase = createClient();

	// Fetch the library
	const { data: library, error: libraryError } = await supabase
		.from("libraries")
		.select("*")
		.eq("id", libraryId)
		.single();

	if (libraryError || !library) {
		return NextResponse.json({ error: "Library not found" }, { status: 404 });
	}

	// Get already recommended tmdb_ids to avoid repeats
	const { data: existing } = await supabase
		.from("recommendations")
		.select("tmdb_id")
		.eq("library_id", libraryId);

	const excludeIds = (existing ?? []).map(
		(r: { tmdb_id: number }) => r.tmdb_id,
	);

	// Fetch a matching movie
	const movie = await getMovieForLibrary(
		library.genres,
		library.year_from,
		library.year_to,
		excludeIds,
	);

	if (!movie) {
		return NextResponse.json(
			{ error: "No movie found for this library" },
			{ status: 500 },
		);
	}

	// Save to Supabase
	const { data: saved, error: insertError } = await supabase
		.from("recommendations")
		.insert({
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
		})
		.select()
		.single();

	if (insertError) {
		console.error("Error saving recommendation:", insertError);
		return NextResponse.json(
			{ error: "Failed to save recommendation" },
			{ status: 500 },
		);
	}

	// Send email to user
	await sendMovieEmail(library.email, library.name, library.frequency, movie);

	return NextResponse.json(saved);
}
