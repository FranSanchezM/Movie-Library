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
import type { EnrichedMovie } from "@/lib/tmdb";

interface MovieRecommendationEmailProps {
	libraryName: string;
	movie: EnrichedMovie;
	frequency: "daily" | "weekly";
}

export function MovieRecommendationEmail({
	libraryName,
	movie,
	frequency,
}: MovieRecommendationEmailProps) {
	const freqLabel = frequency === "daily" ? "de hoy" : "de la semana";
	const subject = `🎬 Tu recomendación ${freqLabel}: ${movie.title}`;

	return (
		<Html lang="es">
			<Head />
			<Preview>{subject}</Preview>
			<Body
				style={{
					backgroundColor: "#080808",
					fontFamily: "'DM Sans', Helvetica, Arial, sans-serif",
					margin: 0,
					padding: 0,
				}}
			>
				<Container
					style={{
						maxWidth: "560px",
						margin: "0 auto",
						padding: "40px 20px",
					}}
				>
					{/* Header */}
					<Section
						style={{
							textAlign: "center" as const,
							marginBottom: "32px",
						}}
					>
						<Text
							style={{
								fontFamily: "'Bebas Neue', Impact, sans-serif",
								fontSize: "28px",
								letterSpacing: "4px",
								color: "#D4A853",
								margin: 0,
							}}
						>
							🎬 CINERANDOM
						</Text>
						<Text
							style={{
								fontSize: "13px",
								color: "#666",
								margin: "4px 0 0",
								letterSpacing: "1px",
							}}
						>
							Recomendación {freqLabel} · {libraryName}
						</Text>
					</Section>

					{/* Movie Card */}
					<Section
						style={{
							backgroundColor: "#111",
							border: "1px solid #1e1e1e",
							borderRadius: "16px",
							overflow: "hidden",
							marginBottom: "24px",
						}}
					>
						{/* Poster */}
						{movie.posterUrl && (
							<Img
								src={movie.posterUrl}
								alt={movie.title}
								width="560"
								style={{
									width: "100%",
									maxHeight: "320px",
									objectFit: "cover",
									display: "block",
								}}
							/>
						)}

						{/* Content */}
						<Section style={{ padding: "24px" }}>
							<Heading
								style={{
									fontFamily: "'Bebas Neue', Impact, sans-serif",
									fontSize: "32px",
									letterSpacing: "2px",
									color: "#F5F0E8",
									margin: "0 0 4px",
									lineHeight: "1.1",
								}}
							>
								{movie.title}
							</Heading>
							<Text
								style={{
									fontSize: "13px",
									color: "#888",
									margin: "0 0 16px",
								}}
							>
								{movie.releaseYear}
							</Text>

							{/* Ratings */}
							{(movie.tmdbRating || movie.imdbRating || movie.rtRating) && (
								<Section
									style={{
										display: "flex",
										gap: "8px",
										marginBottom: "16px",
										flexWrap: "wrap",
									}}
								>
									{movie.tmdbRating && (
										<Text
											style={{
												display: "inline-block",
												fontSize: "11px",
												fontWeight: "700",
												color: "#D4A853",
												backgroundColor: "rgba(212,168,83,0.1)",
												border: "1px solid rgba(212,168,83,0.3)",
												borderRadius: "4px",
												padding: "3px 8px",
												margin: "0 6px 0 0",
											}}
										>
											⭐ TMDB {movie.tmdbRating}
										</Text>
									)}
									{movie.imdbRating && (
										<Text
											style={{
												display: "inline-block",
												fontSize: "11px",
												fontWeight: "700",
												color: "#D4A853",
												backgroundColor: "rgba(212,168,83,0.1)",
												border: "1px solid rgba(212,168,83,0.3)",
												borderRadius: "4px",
												padding: "3px 8px",
												margin: "0 6px 0 0",
											}}
										>
											🎞 IMDb {movie.imdbRating}
										</Text>
									)}
									{movie.rtRating && (
										<Text
											style={{
												display: "inline-block",
												fontSize: "11px",
												fontWeight: "700",
												color: "#D4A853",
												backgroundColor: "rgba(212,168,83,0.1)",
												border: "1px solid rgba(212,168,83,0.3)",
												borderRadius: "4px",
												padding: "3px 8px",
												margin: "0",
											}}
										>
											🍅 RT {movie.rtRating}
										</Text>
									)}
								</Section>
							)}

							{/* Description */}
							{movie.description && (
								<Text
									style={{
										fontSize: "14px",
										lineHeight: "1.65",
										color: "#aaa",
										margin: "0 0 24px",
									}}
								>
									{movie.description}
								</Text>
							)}

							{/* CTAs */}
							<Section style={{ display: "flex", gap: "12px" }}>
								<Button
									href={movie.letterboxdUrl}
									style={{
										display: "inline-block",
										backgroundColor: "#D4A853",
										color: "#080808",
										fontWeight: "700",
										fontSize: "13px",
										letterSpacing: "1px",
										textDecoration: "none",
										borderRadius: "8px",
										padding: "12px 24px",
										marginRight: "12px",
									}}
								>
									VER EN LETTERBOXD
								</Button>
								{movie.imdbUrl && (
									<Button
										href={movie.imdbUrl}
										style={{
											display: "inline-block",
											backgroundColor: "transparent",
											color: "#D4A853",
											fontWeight: "600",
											fontSize: "13px",
											letterSpacing: "1px",
											textDecoration: "none",
											borderRadius: "8px",
											border: "1px solid rgba(212,168,83,0.4)",
											padding: "12px 20px",
										}}
									>
										IMDb
									</Button>
								)}
							</Section>
						</Section>
					</Section>

					<Hr style={{ borderColor: "#1e1e1e", margin: "0 0 24px" }} />

					{/* Footer */}
					<Text
						style={{
							fontSize: "11px",
							color: "#444",
							textAlign: "center",
							margin: 0,
							lineHeight: "1.6",
						}}
					>
						Estás recibiendo este email porque creaste una biblioteca en CineRandom.
						<br />
						Biblioteca: {libraryName}
					</Text>
				</Container>
			</Body>
		</Html>
	);
}
