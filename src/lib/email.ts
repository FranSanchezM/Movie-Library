import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import { MovieRecommendationEmail } from "../app/emails/movies-recommendation";
import type { EnrichedMovie } from "./tmdb";

// Usamos el servicio de Gmail directamente
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS, // Contraseña de Aplicación de Google (no tu contraseña real)
	},
});

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

	try {
		await transporter.sendMail({
			from: `"CineRandom" <${process.env.EMAIL_USER}>`, // Aparecerá como CineRandom pero desde tu Gmail
			to: email,
			subject: `🎬 Tu recomendación ${frequency === "daily" ? "de hoy" : "de la semana"}: ${movie.title}`,
			html,
		});
	} catch (error) {
		console.error("Error enviando email con Nodemailer:", error);
	}
}
