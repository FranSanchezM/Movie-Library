import type { Metadata } from "next";

import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { bebasNeue, dmSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";

export const metadata: Metadata = {
	title: {
		default: "CineRandom",
		template: "%s | CineRandom",
	},
	metadataBase: new URL("https://cinerandom.app"),
	applicationName: "CineRandom",
	category: "website",
	description:
		"Recibe recomendaciones de películas aleatorias por email según tus gustos.",
	keywords: ["películas", "recomendaciones", "cine", "random"],
	icons: {
		icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎬</text></svg>",
	},
};

interface Props extends PropsWithChildren {}

export default function RootLayout({ children }: Readonly<Props>) {
	return (
		<html lang="es" suppressHydrationWarning>
			<body
				className={cn(
					"antialiased min-h-[100dvh]",
					bebasNeue.variable,
					dmSans.variable,
					dmSans.className,
				)}
				style={{ background: "#080808", color: "#F5F0E8" }}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					forcedTheme="dark"
					enableSystem={false}
					disableTransitionOnChange
					enableColorScheme
				>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
