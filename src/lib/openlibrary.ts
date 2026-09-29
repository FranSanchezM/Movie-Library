import type { Genre } from "@/config/media";

// Open Library client (public API, no key). It asks for a descriptive
// User-Agent; keep calls few: at most two searches and one work lookup per pick.
const OL_BASE = "https://openlibrary.org";
const USER_AGENT =
	"CineRandom/1.0 (weekly recommendations app; contact: dev@cinerandom.app)";
const TIMEOUT_MS = 8000;
const PAGE_SIZE = 100;

/** Quality gate: books need at least this many ratings. */
export const MIN_RATINGS_COUNT = 10;

/** Open Library language codes */
const LANGUAGE_CODE: Record<string, string> = { es: "spa", en: "eng" };

const LENGTH_RANGE: Record<string, string> = {
	short: "number_of_pages_median:[1 TO 249]",
	medium: "number_of_pages_median:[250 TO 450]",
	long: "number_of_pages_median:[451 TO *]",
};

export interface BookFilters {
	genres: readonly Genre[];
	yearFrom: number;
	yearTo: number;
	length: string; // short | medium | long | any
	language: string; // es | en | any
	minRating: number;
}

export interface OpenLibraryDoc {
	/** "/works/OL123W" */
	key: string;
	title: string;
	author_name?: string[];
	first_publish_year?: number;
	cover_i?: number;
	ratings_average?: number;
	ratings_count?: number;
	number_of_pages_median?: number;
}

async function olFetch(url: string): Promise<Response | null> {
	try {
		const res = await fetch(url, {
			headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
			signal: AbortSignal.timeout(TIMEOUT_MS),
			next: { revalidate: 3600 },
		});
		if (res.status === 429) {
			console.error("Open Library rate limit (429)");
			return null;
		}
		if (!res.ok) {
			console.error("Open Library error:", res.status, url);
			return null;
		}
		return res;
	} catch (error) {
		console.error("Open Library request failed:", error);
		return null;
	}
}

function buildQuery(f: BookFilters): string {
	const parts: string[] = [];

	const subjects = f.genres
		.map((g) => g.key)
		.filter((k): k is string => Boolean(k))
		.map((k) => `subject:"${k}"`);
	if (subjects.length > 0) parts.push(`(${subjects.join(" OR ")})`);

	parts.push(`first_publish_year:[${f.yearFrom} TO ${f.yearTo}]`);
	// Float ranges do not work on ratings_average, so only the count is
	// filtered in the query; the average is checked on the results.
	parts.push(`ratings_count:[${MIN_RATINGS_COUNT} TO *]`);
	if (f.length in LENGTH_RANGE) parts.push(LENGTH_RANGE[f.length]);

	return parts.join(" AND ");
}

async function searchPage(
	f: BookFilters,
	page: number,
): Promise<{ docs: OpenLibraryDoc[]; numFound: number } | null> {
	const params = new URLSearchParams({
		q: buildQuery(f),
		sort: "rating",
		limit: String(PAGE_SIZE),
		page: String(page),
		fields:
			"key,title,author_name,first_publish_year,cover_i,ratings_average,ratings_count,number_of_pages_median",
	});
	// Works with at least one edition in that language
	if (LANGUAGE_CODE[f.language])
		params.set("language", LANGUAGE_CODE[f.language]);

	const res = await olFetch(`${OL_BASE}/search.json?${params}`);
	if (!res) return null;

	const data = await res.json();
	return { docs: data.docs ?? [], numFound: data.numFound ?? 0 };
}

/**
 * A random book matching the filters, not in `excludeKeys` (work ids).
 * Results are rating-ordered: page 1 gives the pool size, then one random page
 * is tried; page 1 (top rated) is the fallback.
 */
export async function pickBook(
	f: BookFilters,
	excludeKeys: string[],
): Promise<OpenLibraryDoc | null> {
	const exclude = new Set(excludeKeys);
	const eligible = (docs: OpenLibraryDoc[]) =>
		docs.filter(
			(d) =>
				!exclude.has(workId(d.key)) &&
				Boolean(d.title) &&
				(d.ratings_count ?? 0) >= MIN_RATINGS_COUNT &&
				(d.ratings_average ?? 0) >= f.minRating &&
				// Unknown page counts only pass without a length preference
				(f.length === "any" || d.number_of_pages_median != null),
		);
	const random = <T>(list: T[]) =>
		list[Math.floor(Math.random() * list.length)];

	const first = await searchPage(f, 1);
	if (!first) return null;

	const pages = Math.max(1, Math.ceil(first.numFound / PAGE_SIZE));
	if (pages > 1) {
		// Rating-ordered: qualifying books are concentrated in the first pages
		const page = Math.floor(Math.random() * pages) + 1;
		if (page > 1) {
			const other = await searchPage(f, page);
			const pool = eligible(other?.docs ?? []);
			if (pool.length > 0) return random(pool);
		}
	}

	const pool = eligible(first.docs);
	return pool.length > 0 ? random(pool) : null;
}

/** "/works/OL123W" -> "OL123W" */
export function workId(key: string): string {
	return key.replace("/works/", "");
}

/** Work description (string or { value }); null when missing or on failure. */
export async function fetchWorkDescription(id: string): Promise<string | null> {
	const res = await olFetch(`${OL_BASE}/works/${id}.json`);
	if (!res) return null;

	try {
		const data = await res.json();
		const d = data.description;
		const text = typeof d === "string" ? d : (d?.value as string | undefined);
		// Descriptions often end with "----" and source links; keep the first block
		return text ? text.split(/\r?\n-{3,}/)[0].trim() || null : null;
	} catch {
		return null;
	}
}

export function coverUrl(coverId: number | undefined): string | null {
	return coverId
		? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
		: null;
}

export function workUrl(id: string): string {
	return `${OL_BASE}/works/${id}`;
}
