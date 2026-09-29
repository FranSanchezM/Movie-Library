// Shared styles for the onboarding and settings forms (classes prefixed "ob-").
export function ProfileFormStyles() {
	return (
		<style>{`
			.ob-root {
				min-height: 100dvh;
				background: #080808;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 2rem 1rem;
				font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
				color: #F5F0E8;
			}
			.ob-card {
				width: 100%;
				max-width: 520px;
				background: #111;
				border: 1px solid #1e1e1e;
				border-radius: 16px;
				padding: 2.5rem 2rem;
				display: flex;
				flex-direction: column;
				gap: 2rem;
			}
			.ob-logo {
				display: flex;
				align-items: center;
				gap: 0.6rem;
			}
			.ob-logo-emoji { font-size: 1.6rem; line-height: 1; }
			.ob-logo-text {
				font-family: var(--font-bebas-neue), 'Bebas Neue', cursive;
				font-size: 1.6rem;
				letter-spacing: 0.1em;
				color: #D4A853;
				line-height: 1;
			}
			.ob-progress {
				display: flex;
				gap: 0.4rem;
			}
			.ob-progress-bar {
				flex: 1;
				height: 3px;
				border-radius: 2px;
				background: #222;
				transition: background 0.3s ease;
			}
			.ob-progress-bar.active { background: #D4A853; }
			.ob-step-title {
				font-family: var(--font-bebas-neue), 'Bebas Neue', cursive;
				font-size: 2rem;
				letter-spacing: 0.05em;
				color: #F5F0E8;
				margin: 0 0 0.25rem;
				line-height: 1.1;
			}
			.ob-step-subtitle {
				font-size: 0.85rem;
				color: #666;
				margin: 0;
				line-height: 1.5;
			}
			.ob-stack {
				display: flex;
				flex-direction: column;
				gap: 1rem;
			}
			.ob-field {
				display: flex;
				flex-direction: column;
				gap: 0.45rem;
			}
			.ob-label {
				font-size: 0.78rem;
				font-weight: 600;
				letter-spacing: 0.07em;
				text-transform: uppercase;
				color: #888;
			}
			.ob-hint {
				font-size: 0.75rem;
				color: #666;
				margin: 0;
				line-height: 1.4;
			}
			.ob-input {
				background: #0d0d0d;
				border: 1px solid #2a2a2a;
				border-radius: 8px;
				padding: 0.7rem 0.9rem;
				font-size: 0.95rem;
				color: #F5F0E8;
				font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
				outline: none;
				transition: border-color 0.18s ease;
				width: 100%;
				box-sizing: border-box;
			}
			.ob-input:focus { border-color: #D4A853; }
			.ob-input::placeholder { color: #444; }
			select.ob-input { cursor: pointer; }
			.ob-genres {
				display: flex;
				flex-wrap: wrap;
				gap: 0.5rem;
			}
			.ob-genre-btn {
				font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
				font-size: 0.8rem;
				font-weight: 500;
				padding: 0.35rem 0.8rem;
				border-radius: 20px;
				border: 1px solid #2a2a2a;
				background: #0d0d0d;
				color: #888;
				cursor: pointer;
				transition: all 0.16s ease;
			}
			.ob-genre-btn:hover { border-color: #555; color: #F5F0E8; }
			.ob-genre-btn.selected {
				border-color: #D4A853;
				background: rgba(212, 168, 83, 0.1);
				color: #D4A853;
			}
			.ob-provider-btn {
				display: inline-flex;
				align-items: center;
				gap: 0.45rem;
			}
			.ob-provider-logo {
				width: 20px;
				height: 20px;
				border-radius: 4px;
				object-fit: cover;
			}
			.ob-providers {
				max-height: 220px;
				overflow-y: auto;
				padding-right: 0.25rem;
			}
			.ob-range-row {
				display: flex;
				gap: 0.75rem;
				align-items: center;
			}
			.ob-range-label {
				font-size: 0.78rem;
				color: #888;
				white-space: nowrap;
			}
			.ob-check-row {
				display: flex;
				align-items: center;
				gap: 0.5rem;
			}
			.ob-check-row input {
				cursor: pointer;
				width: 16px;
				height: 16px;
				accent-color: #D4A853;
			}
			.ob-check-row label {
				font-size: 0.85rem;
				color: #aaa;
				cursor: pointer;
				user-select: none;
			}
			.ob-actions {
				display: flex;
				gap: 0.75rem;
				justify-content: flex-end;
				padding-top: 0.5rem;
			}
			.ob-btn-secondary {
				font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
				font-size: 0.85rem;
				font-weight: 600;
				padding: 0.65rem 1.2rem;
				border-radius: 8px;
				border: 1px solid #2a2a2a;
				background: transparent;
				color: #888;
				cursor: pointer;
				transition: all 0.16s ease;
				letter-spacing: 0.03em;
				text-decoration: none;
				display: inline-flex;
				align-items: center;
			}
			.ob-btn-secondary:hover { border-color: #555; color: #F5F0E8; }
			.ob-btn-primary {
				font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
				font-size: 0.85rem;
				font-weight: 700;
				padding: 0.65rem 1.4rem;
				border-radius: 8px;
				border: none;
				background: #D4A853;
				color: #080808;
				cursor: pointer;
				letter-spacing: 0.04em;
				transition: background 0.16s ease, transform 0.12s ease;
			}
			.ob-btn-primary:hover:not(:disabled) {
				background: #e4bc6a;
				transform: translateY(-1px);
			}
			.ob-btn-primary:disabled {
				opacity: 0.45;
				cursor: not-allowed;
			}
			.ob-error {
				font-size: 0.78rem;
				color: #e57373;
				background: rgba(229,115,115,0.07);
				border: 1px solid rgba(229,115,115,0.2);
				border-radius: 6px;
				padding: 0.55rem 0.8rem;
				margin: 0;
			}
			.ob-success {
				font-size: 0.78rem;
				color: #81c784;
				background: rgba(129,199,132,0.07);
				border: 1px solid rgba(129,199,132,0.2);
				border-radius: 6px;
				padding: 0.55rem 0.8rem;
				margin: 0;
			}
			.ob-summary-row {
				display: flex;
				justify-content: space-between;
				font-size: 0.85rem;
				padding: 0.4rem 0;
				border-bottom: 1px solid #1a1a1a;
				color: #aaa;
			}
			.ob-summary-row span:last-child { color: #F5F0E8; font-weight: 500; }
			.ob-section-title {
				font-family: var(--font-bebas-neue), 'Bebas Neue', cursive;
				font-size: 1.3rem;
				letter-spacing: 0.08em;
				color: #D4A853;
				margin: 0;
			}
			@media (max-width: 500px) {
				.ob-card { padding: 1.75rem 1.25rem; }
				.ob-step-title { font-size: 1.7rem; }
			}
		`}</style>
	);
}
