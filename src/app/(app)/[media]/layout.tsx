import { getSectionBySlug } from "@/config/media";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

// Scopes the section theme (CSS variables) to everything under /<slug>.
export default async function MediaLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ media: string }>;
}) {
	const { media } = await params;
	const section = getSectionBySlug(media);
	if (!section) notFound();

	return (
		<div data-media={section.slug} className="m-section">
			{children}
		</div>
	);
}
