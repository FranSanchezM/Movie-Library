import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import {
	MediaRecommendationEmail,
	getEmailSubject,
} from "../app/emails/media-recommendation";
import type { Profile } from "../types";
import type { EnrichedMedia } from "./media";

// Usamos el servicio de Gmail directamente
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS, // Contraseña de Aplicación de Google (no tu contraseña real)
	},
});

export async function sendMediaEmail(
	profile: Pick<Profile, "email" | "name" | "language">,
	media: EnrichedMedia,
) {
	const html = await render(
		MediaRecommendationEmail({
			profileName: profile.name,
			media,
			language: profile.language,
		}),
	);

	try {
		if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
			console.error("⚠️ Nodemailer: Falta EMAIL_USER o EMAIL_PASS en el .env");
			return;
		}

		await transporter.sendMail({
			from: `"CineRandom" <${process.env.EMAIL_USER}>`,
			to: profile.email,
			subject: getEmailSubject(profile.language, media),
			html,
		});
		console.log(`✅ Email enviado a ${profile.email}: ${media.title}`);
	} catch (error) {
		console.error("❌ Error enviando email con Nodemailer:", error);
	}
}
