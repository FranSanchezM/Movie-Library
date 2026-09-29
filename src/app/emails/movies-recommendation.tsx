import type { EnrichedMovie } from "@/lib/tmdb";
import type { Language } from "@/types";
import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Preview,
	Section,
	Text,
} from "@react-email/components";

const COPY = {
	es: {
		subject: (title: string) => `🎬 Tu recomendación de la semana: ${title}`,
		welcome: "🎬 Bienvenido a CineRandom",
		tagline: "Tu viaje cinematográfico empieza ahora",
		eyebrow: "TU PELÍCULA DE ESTA SEMANA",
		poster: (title: string) => `Póster de ${title}`,
		letterboxd: "Ver en Letterboxd",
		imdb: "Ver en IMDb",
		footer:
			"Cada semana, descubrirás una nueva película recomendada según tus gustos.",
		receivingFor: "Estás recibiendo este correo por tu perfil:",
	},
	en: {
		subject: (title: string) => `🎬 Your recommendation of the week: ${title}`,
		welcome: "🎬 Welcome to CineRandom",
		tagline: "Your cinematic journey starts now",
		eyebrow: "YOUR MOVIE OF THE WEEK",
		poster: (title: string) => `Poster of ${title}`,
		letterboxd: "View on Letterboxd",
		imdb: "View on IMDb",
		footer: "Every week, you will discover a new movie picked for your taste.",
		receivingFor: "You are receiving this email for your profile:",
	},
} satisfies Record<Language, unknown>;

export function getEmailSubject(language: Language, title: string): string {
	return COPY[language].subject(title);
}

interface MovieRecommendationEmailProps {
	profileName: string;
	movie: EnrichedMovie;
	language: Language;
}

export function MovieRecommendationEmail({
	profileName,
	movie,
	language,
}: MovieRecommendationEmailProps) {
	const t = COPY[language];
	const subject = t.subject(movie.title);

	return (
		<Html lang={language}>
			<Head />
			<Preview>{subject}</Preview>
			<Body
				style={{
					backgroundColor: "#f5f5f5",
					fontFamily:
						"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
					margin: 0,
					padding: 0,
				}}
			>
				<Container
					style={{
						maxWidth: "600px",
						margin: "0 auto",
						padding: "20px 0 40px",
					}}
				>
					{/* Dark Header Block */}
					<Section
						style={{
							backgroundColor: "#080808",
							padding: "40px 20px",
							textAlign: "center",
							borderRadius: "8px 8px 0 0",
						}}
					>
						<Heading
							style={{
								margin: "0 0 10px",
								fontSize: "26px",
								lineHeight: "1.2",
								color: "#ffffff",
								fontWeight: "600",
							}}
						>
							{t.welcome}
						</Heading>
						<Text
							style={{
								margin: 0,
								fontSize: "15px",
								color: "#D4A853",
								lineHeight: "1.4",
							}}
						>
							{t.tagline}
						</Text>
					</Section>

					{/* Content Block */}
					<Section
						style={{
							backgroundColor: "#ffffff",
							padding: "40px 30px",
							textAlign: "center",
							borderRadius: "0 0 8px 8px",
							border: "1px solid #eaeaec",
							borderTop: "none",
						}}
					>
						<Text
							style={{
								fontSize: "11px",
								fontWeight: "600",
								letterSpacing: "0.1em",
								color: "#888888",
								textTransform: "uppercase",
								margin: "0 0 20px",
							}}
						>
							{t.eyebrow}
						</Text>

						{movie.posterUrl && (
							<Img
								src={movie.posterUrl}
								alt={t.poster(movie.title)}
								width="240"
								style={{
									width: "240px",
									maxWidth: "100%",
									margin: "0 auto 24px",
									borderRadius: "8px",
									boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
									display: "block",
								}}
							/>
						)}

						<Heading
							style={{
								fontSize: "24px",
								fontWeight: "700",
								color: "#1a1a1a",
								margin: "0 0 8px",
								lineHeight: "1.2",
							}}
						>
							{movie.title}
						</Heading>
						<Text
							style={{
								fontSize: "14px",
								color: "#666666",
								margin: "0 0 20px",
							}}
						>
							{movie.releaseYear}
							{movie.tmdbRating ? ` • ⭐ ${movie.tmdbRating}` : ""}
						</Text>

						{movie.description && (
							<Text
								style={{
									fontSize: "15px",
									lineHeight: "1.6",
									color: "#444444",
									margin: "0 auto 30px",
									maxWidth: "460px",
								}}
							>
								{movie.description}
							</Text>
						)}

						<Button
							href={movie.letterboxdUrl}
							style={{
								backgroundColor: "#0077b6", // Un tono azul similar al del ejemplo
								color: "#ffffff",
								fontSize: "15px",
								fontWeight: "600",
								textDecoration: "none",
								textAlign: "center",
								padding: "14px 28px",
								borderRadius: "6px",
								display: "inline-block",
							}}
						>
							{t.letterboxd}
						</Button>

						{movie.imdbUrl && (
							<div style={{ marginTop: "16px" }}>
								<a
									href={movie.imdbUrl}
									style={{
										fontSize: "13px",
										color: "#666666",
										textDecoration: "underline",
									}}
								>
									{t.imdb}
								</a>
							</div>
						)}
					</Section>

					{/* Footer */}
					<Section style={{ padding: "30px 20px", textAlign: "center" }}>
						<Text
							style={{
								margin: 0,
								fontSize: "12px",
								color: "#999999",
								lineHeight: "1.5",
							}}
						>
							{t.footer}
							<br />
							{t.receivingFor} <strong>{profileName}</strong>.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}
