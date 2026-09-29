import { SECTIONS, type ThemeColors } from "@/config/media";

function colorVars(c: ThemeColors): string {
	return `--m-accent:${c.accent};--m-accent-2:${c.accent2};--m-accent-fg:${c.accentFg};`;
}

// Built from the media registry so themes have a single source of truth.
// Sections opt in with a data-media="<slug>" attribute; every descendant then
// reads --m-* variables (accent, gradient colors, card shape, title style).
// Light values are the default, .dark overrides the colors.
function buildCss(): string {
	const rules = SECTIONS.map((s) => {
		const shape = `--m-radius:${s.theme.cardRadius};--m-ratio:${s.theme.posterRatio};--m-title-font:${s.theme.titleFont};--m-title-tracking:${s.theme.titleTracking};--m-title-transform:${s.theme.titleTransform};`;
		return [
			`[data-media="${s.slug}"]{${colorVars(s.theme.light)}${shape}}`,
			`.dark [data-media="${s.slug}"]{${colorVars(s.theme.dark)}}`,
		].join("\n");
	});

	return `
:root{--m-accent:#D4A853;--m-accent-2:#F2B84B;--m-accent-fg:#080808;--m-radius:12px;--m-ratio:2 / 3;--m-title-font:var(--font-bebas-neue),'Bebas Neue',cursive;--m-title-tracking:0.04em;--m-title-transform:none;}
[data-media],:root{
	--m-soft:color-mix(in srgb,var(--m-accent) 12%,transparent);
	--m-border:color-mix(in srgb,var(--m-accent) 35%,transparent);
	--m-glow:color-mix(in srgb,var(--m-accent) 22%,transparent);
	--m-gradient:linear-gradient(135deg,var(--m-accent),var(--m-accent-2));
}
${rules.join("\n")}
.m-section{min-height:100%;background:radial-gradient(1000px 340px at 0% 0%,var(--m-glow),transparent 70%);}
.m-title{font-family:var(--m-title-font);letter-spacing:var(--m-title-tracking);text-transform:var(--m-title-transform);}
.m-btn{display:inline-flex;align-items:center;gap:.45rem;font-family:var(--font-dm-sans),'DM Sans',sans-serif;font-size:.85rem;font-weight:700;letter-spacing:.04em;color:var(--m-accent-fg);background:var(--m-gradient);border:none;border-radius:10px;padding:.65rem 1.2rem;cursor:pointer;text-decoration:none;transition:filter .16s ease,transform .12s ease;white-space:nowrap;}
.m-btn:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px);}
.m-btn:disabled{opacity:.5;cursor:not-allowed;}
.m-panel{background:#111;border:1px solid var(--m-border);border-radius:16px;}
`;
}

const CSS = buildCss();

export function MediaThemeStyles() {
	return <style>{CSS}</style>;
}
