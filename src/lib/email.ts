import { render } from "@react-email/render";
import { Resend } from "resend";
import { MovieRecommendationEmail } from "../app/emails/movies-recommendation";
import type { EnrichedMovie } from "./tmdb";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMovieEmail(
	email: string,
	libraryName: string,
	frequency: "daily" | "weekly",
	movie: EnrichedMovie,
) {
	const html = await render(
		MovieRecommendationEmail({
			libraryName,
			movie,
			frequency,
		}),
	);

	const { error } = await resend.emails.send({
		from: "CineRandom <onboarding@resend.dev>",
		to: email,
		subject: `🎬 Tu recomendación ${frequency === "daily" ? "de hoy" : "de la semana"}: ${movie.title}`,
		html,
	});

	if (error) {
		console.error("Error sending email:", error);
	}
}
