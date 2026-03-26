import { Bebas_Neue, DM_Sans, Montserrat, Poppins } from "next/font/google";

export const poppins = Poppins({
	variable: "--font-poppins",
	subsets: ["latin"],
	weight: ["400", "500", "700"],
});

export const montserrat = Montserrat({
	variable: "--font-montserrat",
	subsets: ["latin"],
	weight: ["400", "500", "700"],
});

export const bebasNeue = Bebas_Neue({
	variable: "--font-bebas-neue",
	subsets: ["latin"],
	weight: ["400"],
});

export const dmSans = DM_Sans({
	variable: "--font-dm-sans",
	subsets: ["latin"],
	weight: ["400", "500", "700"],
});
