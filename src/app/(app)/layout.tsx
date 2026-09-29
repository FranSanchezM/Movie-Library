import { AppShell } from "@/components/shell/app-shell";
import { MediaThemeStyles } from "@/components/shell/media-theme-styles";
import { getCurrentProfile, getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

// Authenticated area: everything under it requires a session (and has a profile).
export default async function AppLayout({ children }: { children: ReactNode }) {
	const user = await getCurrentUser();
	if (!user) redirect("/login");

	const profile = await getCurrentProfile();
	if (!profile) redirect("/login?error=auth");

	return (
		<>
			<MediaThemeStyles />
			<AppShell name={profile.name} email={profile.email}>
				{children}
			</AppShell>
		</>
	);
}
