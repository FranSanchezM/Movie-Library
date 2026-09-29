import { getCurrentProfile, isUuid } from "@/lib/session";
import { createUserClient } from "@/lib/supabase-server";
import type { Library, Recommendation } from "@/types";
import { NextResponse } from "next/server";

// Backup of one yearly library: GET /api/libraries/:id/export?format=json|csv

const CSV_COLUMNS = [
	"recommended_at",
	"title",
	"release_year",
	"tmdb_id",
	"imdb_id",
	"tmdb_rating",
	"imdb_rating",
	"rt_rating",
	"is_seen",
	"feedback",
	"letterboxd_url",
	"description",
] as const;

function csvCell(value: unknown): string {
	if (value === null || value === undefined) return "";
	let text = String(value);
	// Neutralize spreadsheet formula injection
	if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
	return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(recommendations: Recommendation[]): string {
	const rows = recommendations.map((r) =>
		[
			r.recommended_at,
			r.title,
			r.release_year,
			r.tmdb_id,
			r.imdb_id,
			r.tmdb_rating,
			r.imdb_rating,
			r.rt_rating,
			r.is_seen ?? false,
			r.feedback,
			r.slug,
			r.description,
		]
			.map(csvCell)
			.join(","),
	);
	// BOM so spreadsheet apps detect UTF-8
	return `﻿${[CSV_COLUMNS.join(","), ...rows].join("\r\n")}\r\n`;
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ libraryId: string }> },
) {
	const { libraryId } = await params;
	const profile = await getCurrentProfile();

	if (!profile) {
		return NextResponse.json({ error: "Not signed in" }, { status: 401 });
	}
	if (!isUuid(libraryId)) {
		return NextResponse.json({ error: "Invalid library id" }, { status: 400 });
	}

	const format = new URL(request.url).searchParams.get("format") ?? "json";
	if (format !== "json" && format !== "csv") {
		return NextResponse.json(
			{ error: "format must be json or csv" },
			{ status: 400 },
		);
	}

	const supabase = await createUserClient();

	const { data: library } = await supabase
		.from("libraries")
		.select("*")
		.eq("id", libraryId)
		.eq("profile_id", profile.id)
		.maybeSingle<Library>();

	if (!library) {
		return NextResponse.json({ error: "Library not found" }, { status: 404 });
	}

	const { data, error } = await supabase
		.from("recommendations")
		.select("*")
		.eq("library_id", library.id)
		.order("recommended_at", { ascending: true });

	if (error) {
		console.error("Error exporting library:", error);
		return NextResponse.json({ error: "Export failed" }, { status: 500 });
	}

	const recommendations = (data ?? []) as Recommendation[];
	const filename = `cinerandom-library-${library.year}.${format}`;
	const headers = {
		"Content-Disposition": `attachment; filename="${filename}"`,
		"Cache-Control": "no-store",
	};

	if (format === "csv") {
		return new Response(toCsv(recommendations), {
			headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" },
		});
	}

	const body = {
		exported_at: new Date().toISOString(),
		library: { id: library.id, year: library.year },
		recommendations,
	};
	return new Response(JSON.stringify(body, null, 2), {
		headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
	});
}
