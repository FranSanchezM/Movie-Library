import { SECTIONS } from "@/config/media";
import type { ReactNode } from "react";
import { MobileDrawer } from "./mobile-drawer";
import { type NavItem, SidebarNav } from "./sidebar-nav";
import { UserBox } from "./user-box";

const ITEMS: NavItem[] = [
	{ href: "/", label: "Inicio", icon: "🏠" },
	...SECTIONS.map((s) => ({
		href: `/${s.slug}`,
		label: s.label,
		icon: s.icon,
		media: s.slug,
		soon: !s.available,
	})),
	{ href: "/settings", label: "Configuración", icon: "⚙️" },
];

function Brand() {
	return (
		<span className="font-[family-name:var(--font-bebas-neue)] text-2xl tracking-widest text-[#D4A853]">
			🎬 CineRandom
		</span>
	);
}

/**
 * Dashboard shell: fixed sidebar on desktop, top bar + drawer on mobile.
 * Server component; only the nav list (active state) and the drawer are client.
 */
export function AppShell({
	name,
	email,
	children,
}: {
	name: string;
	email: string;
	children: ReactNode;
}) {
	return (
		<div className="min-h-dvh bg-[#080808] text-[#F5F0E8] md:flex">
			<aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/10 bg-[#0d0d0d] p-4 md:flex">
				<div className="mb-6 px-2 pt-1">
					<Brand />
				</div>
				<div className="flex-1 overflow-y-auto">
					<SidebarNav items={ITEMS} />
				</div>
				<div className="mt-4 border-t border-white/10 pt-4">
					<UserBox name={name} email={email} />
				</div>
			</aside>

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#080808]/90 px-4 py-3 backdrop-blur md:hidden">
					<Brand />
					<MobileDrawer items={ITEMS}>
						<UserBox name={name} email={email} />
					</MobileDrawer>
				</header>
				<main className="min-w-0 flex-1">{children}</main>
			</div>
		</div>
	);
}
