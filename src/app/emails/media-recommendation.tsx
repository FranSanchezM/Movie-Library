import type { MediaType } from "@/config/media";
import type { EnrichedMedia } from "@/lib/media";
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

type NounCopy = Record<MediaType, string>;

const COPY = {
	es: {
		subject: (title: string) => `Tu recomendación de la semana: ${title}`,
		welcome: "🎬 Bienvenido a CineRandom",
		tagline: "Tu viaje cinematográfico empieza ahora",
		eyebrow: {
			movie: "TU PELÍCULA DE ESTA SEMANA",
			tv: "TU SERIE DE ESTA SEMANA",
			book: "TU LIBRO DE ESTA SEMANA",
		} satisfies NounCopy,
		poster: (title: string) => `Póster de ${title}`,
		primaryButton: {
			movie: "Ver en Letterboxd",
			tv: "Ver en TMDB",
			book: "Ver en Open Library",
		} satisfies NounCopy,
		imdb: "Ver en IMDb",
		footer: {
			movie:
				"Cada semana, descubrirás una nueva película recomendada según tus gustos.",
			tv: "Cada semana, descubrirás una nueva serie recomendada según tus gustos.",
			book: "Cada semana, descubrirás un nuevo libro recomendado según tus gustos.",
		} satisfies NounCopy,
		receivingFor: "Estás recibiendo este correo por tu perfil:",
		seasons: (n: number) => `${n} temporada${n === 1 ? "" : "s"}`,
		pages: (n: number) => `${n} pág.`,
		by: "de",
	},
	en: {
		subject: (title: string) => `Your recommendation of the week: ${title}`,
		welcome: "🎬 Welcome to CineRandom",
		tagline: "Your cinematic journey starts now",
		eyebrow: {
			movie: "YOUR MOVIE OF THE WEEK",
			tv: "YOUR SERIES OF THE WEEK",
			book: "YOUR BOOK OF THE WEEK",
		} satisfies NounCopy,
		poster: (title: string) => `Poster of ${title}`,
		primaryButton: {
			movie: "View on Letterboxd",
			tv: "View on TMDB",
			book: "View on Open Library",
		} satisfies NounCopy,
		imdb: "View on IMDb",
		footer: {
			movie: "Every week, you will discover a new movie picked for your taste.",
			tv: "Every week, you will discover a new series picked for your taste.",
			book: "Every week, you will discover a new book picked for your taste.",
		} satisfies NounCopy,
		receivingFor: "You are receiving this email for your profile:",
		seasons: (n: number) => `${n} season${n === 1 ? "" : "s"}`,
		pages: (n: number) => `${n} pp.`,
		by: "by",
	},
} satisfies Record<Language, unknown>;

const ICON: Record<MediaType, string> = { movie: "🎬", tv: "📺", book: "📚" };

export function getEmailSubject(
	language: Language,
	media: EnrichedMedia,
): string {
	return `${ICON[media.mediaType]} ${COPY[language].subject(media.title)}`;
}

interface MediaRecommendationEmailProps {
	profileName: string;
	media: EnrichedMedia;
	language: Language;
}

export function MediaRecommendationEmail({
	profileName,
	media,
	language,
}: MediaRecommendationEmailProps) {
	const t = COPY[language];
	const subject = getEmailSubject(language, media);

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
							{t.eyebrow[media.mediaType]}
						</Text>

						{media.posterUrl && (
							<Img
								src={media.posterUrl}
								alt={t.poster(media.title)}
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
							{media.title}
						</Heading>
						{media.creator && (
							<Text
								style={{
									fontSize: "15px",
									color: "#444444",
									margin: "0 0 4px",
								}}
							>
								{t.by} {media.creator}
							</Text>
						)}
						<Text
							style={{
								fontSize: "14px",
								color: "#666666",
								margin: "0 0 20px",
							}}
						>
							{media.releaseYear || ""}
							{media.tmdbRating ? ` • ⭐ ${media.tmdbRating}` : ""}
							{media.rating
								? ` • ⭐ ${media.rating}/5${media.ratingCount ? ` (${media.ratingCount})` : ""}`
								: ""}
							{media.pages ? ` • ${t.pages(media.pages)}` : ""}
							{media.seasons ? ` • ${t.seasons(media.seasons)}` : ""}
						</Text>

						{media.description && (
							<Text
								style={{
									fontSize: "15px",
									lineHeight: "1.6",
									color: "#444444",
									margin: "0 auto 30px",
									maxWidth: "460px",
								}}
							>
								{media.description}
							</Text>
						)}

						<Button
							href={media.primaryUrl}
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
							{t.primaryButton[media.mediaType]}
						</Button>

						{media.imdbUrl && (
							<div style={{ marginTop: "16px" }}>
								<a
									href={media.imdbUrl}
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
							{t.footer[media.mediaType]}
							<br />
							{t.receivingFor} <strong>{profileName}</strong>.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}
