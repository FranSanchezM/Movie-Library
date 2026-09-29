"use client";

import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { type ReactNode, useState } from "react";
import { type NavItem, SidebarNav } from "./sidebar-nav";

/** Mobile navigation: a left drawer with the same items as the sidebar. */
export function MobileDrawer({
	items,
	children,
}: {
	items: NavItem[];
	/** Slot for the user box (server-rendered) */
	children: ReactNode;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Drawer open={open} onOpenChange={setOpen} direction="left">
			<DrawerTrigger asChild>
				<button
					type="button"
					aria-label="Abrir menú"
					className="flex size-10 items-center justify-center rounded-lg border border-white/10 text-zinc-200 hover:bg-white/5"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						aria-hidden="true"
					>
						<path d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
			</DrawerTrigger>
			<DrawerContent className="border-white/10 bg-[#0d0d0d] p-4 text-zinc-100">
				<DrawerTitle className="sr-only">Menú</DrawerTitle>
				<DrawerDescription className="sr-only">
					Navegación principal
				</DrawerDescription>
				<div className="mb-6 flex items-center justify-between">
					<span className="font-[family-name:var(--font-bebas-neue)] text-2xl tracking-widest text-[#D4A853]">
						🎬 CineRandom
					</span>
					<DrawerClose asChild>
						<button
							type="button"
							aria-label="Cerrar menú"
							className="rounded-md px-2 py-1 text-zinc-400 hover:text-zinc-100"
						>
							✕
						</button>
					</DrawerClose>
				</div>
				<div className="flex-1 overflow-y-auto">
					<SidebarNav items={items} onNavigate={() => setOpen(false)} />
				</div>
				<div className="mt-4 border-t border-white/10 pt-4">{children}</div>
			</DrawerContent>
		</Drawer>
	);
}
