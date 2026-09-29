"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
	href: string;
	label: string;
	icon: string;
	/** Section slug: scopes the accent color through data-media */
	media?: string;
	/** Not implemented yet: shown with a "Pronto" badge */
	soon?: boolean;
}

function isActive(pathname: string, href: string): boolean {
	return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Navigation list shared by the desktop sidebar and the mobile drawer. */
export function SidebarNav({
	items,
	onNavigate,
}: {
	items: NavItem[];
	onNavigate?: () => void;
}) {
	const pathname = usePathname();

	return (
		<nav aria-label="Principal" className="flex flex-col gap-1">
			{items.map((item) => {
				const active = isActive(pathname, item.href);
				return (
					<Link
						key={item.href}
						href={item.href}
						data-media={item.media}
						aria-current={active ? "page" : undefined}
						onClick={onNavigate}
						className={cn(
							"group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium transition-colors",
							active
								? "border-[var(--m-border)] bg-[var(--m-soft)] text-[var(--m-accent)]"
								: "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
							item.soon && !active && "opacity-60",
						)}
					>
						<span
							aria-hidden="true"
							className={cn(
								"flex size-7 items-center justify-center rounded-md text-base",
								active ? "bg-[var(--m-accent)]" : "bg-white/5",
							)}
						>
							{item.icon}
						</span>
						<span className="flex-1">{item.label}</span>
						{item.soon && (
							<span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
								Pronto
							</span>
						)}
					</Link>
				);
			})}
		</nav>
	);
}
