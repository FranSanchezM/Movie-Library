"use client";

import type { Recommendation } from "@/types";
import Image from "next/image";
import { useState } from "react";
import { updateRecommendationFeedback, deleteRecommendationAction } from "@/app/recommendation-actions";

interface Props {
	recommendation: Recommendation;
}

export function MovieCard({ recommendation }: Props) {
	const [imgError, setImgError] = useState(false);
	const [isSeen, setIsSeen] = useState(recommendation.is_seen ?? false);
	const [feedback, setFeedback] = useState<"liked" | "disliked" | null>(recommendation.feedback ?? null);
	const [isDeleted, setIsDeleted] = useState(false);

	const {
		id,
		title,
		poster_path,
		release_year,
		tmdb_rating,
		imdb_rating,
		rt_rating,
		description,
		slug,
		imdb_id,
	} = recommendation;

	const imdbUrl = imdb_id ? `https://www.imdb.com/title/${imdb_id}/` : null;

	function handleSeen(e: React.MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		const newVal = !isSeen;
		setIsSeen(newVal);
		updateRecommendationFeedback(id, { is_seen: newVal }).catch(() => setIsSeen(isSeen));
	}

	function handleFeedback(e: React.MouseEvent, val: "liked" | "disliked") {
		e.stopPropagation();
		e.preventDefault();
		const newVal = feedback === val ? null : val;
		setFeedback(newVal);
		updateRecommendationFeedback(id, { feedback: newVal }).catch(() => setFeedback(feedback));
	}

	function handleDelete(e: React.MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		setIsDeleted(true);
		deleteRecommendationAction(id).catch(() => setIsDeleted(false));
	}

	if (isDeleted) return null;

	return (
		<>
			<style>{`
				.movie-card {
					position: relative;
					border-radius: 12px;
					overflow: hidden;
					background: #111;
					border: 1px solid #1e1e1e;
					cursor: pointer;
					transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
					aspect-ratio: 2/3;
					display: flex;
					flex-direction: column;
				}
				.movie-card:hover {
					transform: translateY(-4px);
					border-color: #D4A853;
					box-shadow: 0 8px 32px rgba(212, 168, 83, 0.18);
				}
				.movie-card:hover .movie-card-overlay {
					opacity: 1;
				}
				.movie-card-poster {
					width: 100%;
					height: 100%;
					object-fit: cover;
					display: block;
				}
				.movie-card-poster-placeholder {
					width: 100%;
					height: 100%;
					background: linear-gradient(135deg, #1a1a1a 0%, #222 100%);
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 3rem;
				}
				.movie-card-overlay {
					position: absolute;
					inset: 0;
					background: linear-gradient(
						to top,
						rgba(8, 8, 8, 0.97) 0%,
						rgba(8, 8, 8, 0.85) 45%,
						rgba(8, 8, 8, 0.2) 100%
					);
					opacity: 0;
					transition: opacity 0.25s ease;
					display: flex;
					flex-direction: column;
					justify-content: flex-end;
					padding: 1.25rem;
					gap: 0.5rem;
				}
				.movie-card-footer {
					position: absolute;
					bottom: 0;
					left: 0;
					right: 0;
					background: linear-gradient(to top, rgba(8,8,8,0.95) 0%, transparent 100%);
					padding: 1.5rem 1rem 0.75rem;
				}
				.movie-card:hover .movie-card-footer {
					display: none;
				}
				.movie-card-title {
					font-family: var(--font-bebas-neue), 'Bebas Neue', cursive;
					font-size: 1.25rem;
					line-height: 1.1;
					color: #F5F0E8;
					letter-spacing: 0.04em;
					margin: 0;
				}
				.movie-card-year {
					font-size: 0.75rem;
					color: #888;
					margin: 0;
				}
				.movie-card-overlay-title {
					font-family: var(--font-bebas-neue), 'Bebas Neue', cursive;
					font-size: 1.4rem;
					letter-spacing: 0.05em;
					color: #F5F0E8;
					margin: 0;
					line-height: 1.1;
				}
				.movie-card-ratings {
					display: flex;
					gap: 0.5rem;
					flex-wrap: wrap;
				}
				.movie-card-rating-badge {
					font-size: 0.7rem;
					font-weight: 600;
					padding: 0.2rem 0.45rem;
					border-radius: 4px;
					border: 1px solid #333;
					color: #D4A853;
					background: rgba(212, 168, 83, 0.08);
					letter-spacing: 0.03em;
				}
				.movie-card-description {
					font-size: 0.75rem;
					color: #aaa;
					line-height: 1.5;
					display: -webkit-box;
					-webkit-line-clamp: 4;
					-webkit-box-orient: vertical;
					overflow: hidden;
					margin: 0;
				}
				.movie-card-links {
					display: flex;
					gap: 0.5rem;
					margin-top: 0.25rem;
				}
				.movie-card-link {
					font-size: 0.7rem;
					font-weight: 600;
					color: #D4A853;
					text-decoration: none;
					padding: 0.25rem 0.6rem;
					border: 1px solid rgba(212, 168, 83, 0.35);
					border-radius: 4px;
					transition: background 0.15s ease, border-color 0.15s ease;
					letter-spacing: 0.04em;
				}
				.movie-card-link:hover {
					background: rgba(212, 168, 83, 0.15);
					border-color: #D4A853;
				}
				.mc-action-btns {
					display: flex;
					gap: 0.5rem;
					margin-top: 0.25rem;
					margin-bottom: 0.25rem;
				}
				.mc-action-btn {
					background: rgba(255,255,255,0.05);
					border: 1px solid rgba(255,255,255,0.1);
					border-radius: 50%;
					width: 30px;
					height: 30px;
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;
					color: #fff;
					transition: all 0.2s;
					font-size: 0.85rem;
					padding: 0;
				}
				.mc-action-btn:hover {
					background: rgba(255,255,255,0.15);
				}
				.mc-action-btn.active-seen { background: #0077b6; border-color: #0096c7; }
				.mc-action-btn.active-like { background: #2d6a4f; border-color: #40916c; }
				.mc-action-btn.active-dislike { background: #9d0208; border-color: #d00000; }
				
				.mc-delete-btn {
					position: absolute;
					top: 8px;
					right: 8px;
					z-index: 10;
					background: rgba(0,0,0,0.6);
					backdrop-filter: blur(4px);
					border: 1px solid rgba(255,255,255,0.1);
					border-radius: 50%;
					width: 26px;
					height: 26px;
					display: flex;
					align-items: center;
					justify-content: center;
					color: #fff;
					cursor: pointer;
					transition: background 0.2s, opacity 0.2s;
					font-size: 0.7rem;
					opacity: 0;
					padding: 0;
				}
				.movie-card:hover .mc-delete-btn {
					opacity: 1;
				}
				.mc-delete-btn:hover { background: #d00000; border-color: #ff4d4d; }
			`}</style>
			<div className="movie-card">
				<button 
					className="mc-delete-btn" 
					onClick={handleDelete}
					title="Borrar recomendación"
				>
					❌
				</button>

				{poster_path && !imgError ? (
					<Image
						src={poster_path}
						alt={title}
						fill
						className="movie-card-poster"
						style={{ objectFit: "cover" }}
						onError={() => setImgError(true)}
						sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
					/>
				) : (
					<div className="movie-card-poster-placeholder">🎬</div>
				)}

				{/* Static footer visible on idle */}
				<div className="movie-card-footer">
					<p className="movie-card-title">{title}</p>
					<p className="movie-card-year">{release_year ?? "—"}</p>
				</div>

				{/* Hover overlay */}
				<div className="movie-card-overlay">
					<p className="movie-card-overlay-title">{title}</p>

					<div className="movie-card-ratings">
						{tmdb_rating != null && (
							<span className="movie-card-rating-badge">
								⭐ TMDB {tmdb_rating}
							</span>
						)}
						{imdb_rating && (
							<span className="movie-card-rating-badge">
								🎞 IMDb {imdb_rating}
							</span>
						)}
						{rt_rating && (
							<span className="movie-card-rating-badge">🍅 RT {rt_rating}</span>
						)}
					</div>

					<div className="mc-action-btns">
						<button 
							type="button"
							className={`mc-action-btn ${isSeen ? 'active-seen' : ''}`}
							onClick={handleSeen}
							title={isSeen ? "Marcada como vista" : "Marcar como vista"}
						>
							👁️
						</button>
						<button 
							type="button"
							className={`mc-action-btn ${feedback === 'liked' ? 'active-like' : ''}`}
							onClick={(e) => handleFeedback(e, 'liked')}
							title="Me gustó"
						>
							👍
						</button>
						<button 
							type="button"
							className={`mc-action-btn ${feedback === 'disliked' ? 'active-dislike' : ''}`}
							onClick={(e) => handleFeedback(e, 'disliked')}
							title="No me gustó"
						>
							👎
						</button>
					</div>

					{description && (
						<p className="movie-card-description">{description}</p>
					)}

					<div className="movie-card-links">
						{slug && (
							<a
								href={slug}
								target="_blank"
								rel="noreferrer"
								className="movie-card-link"
								onClick={(e) => e.stopPropagation()}
							>
								LETTERBOXD
							</a>
						)}
						{imdbUrl && (
							<a
								href={imdbUrl}
								target="_blank"
								rel="noreferrer"
								className="movie-card-link"
								onClick={(e) => e.stopPropagation()}
							>
								IMDb
							</a>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
