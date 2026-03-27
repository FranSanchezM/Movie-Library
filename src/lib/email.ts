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
		if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
			console.error("⚠️ Nodemailer: Falta EMAIL_USER o EMAIL_PASS en el .env");
			return;
		}

		await transporter.sendMail({
			from: `"CineRandom" <${process.env.EMAIL_USER}>`,
			to: email,
			subject: `🎬 Tu recomendación ${frequency === "daily" ? "de hoy" : "de la semana"}: ${movie.title}`,
			html,
		});
		console.log(`✅ Email enviado a ${email} para la película: ${movie.title}`);
	} catch (error) {
		console.error("❌ Error enviando email con Nodemailer:", error);
	}
}
