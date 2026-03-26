const OMDB_API_KEY = process.env.OMDB_API_KEY!;

interface OMDbRating {
	Source: string;
	Value: string;
}

interface OMDbResponse {
	imdbRating?: string;
	Ratings?: OMDbRating[];
	Response: "True" | "False";
}

export interface MovieRatings {
	imdbRating: string | null;
	rtRating: string | null;
}

export async function fetchRatings(imdbId: string): Promise<MovieRatings> {
	try {
		const res = await fetch(
			`https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}`,
			{ next: { revalidate: 86400 } },
		);

		if (!res.ok) return { imdbRating: null, rtRating: null };

		const data: OMDbResponse = await res.json();

		if (data.Response === "False") {
			return { imdbRating: null, rtRating: null };
		}

		const rtRating =
			data.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value ?? null;

		return {
			imdbRating: data.imdbRating ?? null,
			rtRating,
		};
	} catch {
		return { imdbRating: null, rtRating: null };
	}
}
