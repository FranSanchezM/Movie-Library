import { isMediaType } from "@/config/media";
import { createRecommendationForProfile } from "@/lib/recommendations";
import { getCurrentProfile } from "@/lib/session";
import { createUserClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// Generates a recommendation for the signed-in user's profile.
export async function POST(request: Request) {
	const profile = await getCurrentProfile();

	if (!profile) {
		return NextResponse.json({ error: "Not signed in" }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	if (!isMediaType(body?.mediaType)) {
		return NextResponse.json({ error: "Invalid mediaType" }, { status: 400 });
	}

	const result = await createRecommendationForProfile(
		await createUserClient(),
		profile.id,
		body.mediaType,
	);

	if (!result.ok) {
		if (result.reason === "profile_not_found") {
			return NextResponse.json({ error: "Profile not found" }, { status: 404 });
		}
		if (result.reason === "media_disabled") {
			return NextResponse.json(
				{ error: "Activá este contenido en Configuración." },
				{ status: 400 },
			);
		}
		if (result.reason === "no_media") {
			return NextResponse.json(
				{ error: "No hay novedades con tus filtros." },
				{ status: 404 },
			);
		}
		return NextResponse.json(
			{ error: "Failed to save recommendation" },
			{ status: 500 },
		);
	}

	return NextResponse.json(result.recommendation);
}
