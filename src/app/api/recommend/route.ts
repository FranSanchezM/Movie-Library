import { createRecommendationForProfile } from "@/lib/recommendations";
import { getCurrentProfile } from "@/lib/session";
import { createUserClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// Generates a recommendation for the signed-in user's profile.
export async function POST() {
	const profile = await getCurrentProfile();

	if (!profile) {
		return NextResponse.json({ error: "Not signed in" }, { status: 401 });
	}

	const result = await createRecommendationForProfile(
		await createUserClient(),
		profile.id,
	);

	if (!result.ok) {
		if (result.reason === "profile_not_found") {
			return NextResponse.json({ error: "Profile not found" }, { status: 404 });
		}
		if (result.reason === "no_movie") {
			return NextResponse.json(
				{ error: "No hay películas nuevas con tus filtros." },
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
