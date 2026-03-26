"use server";

import { createClient } from "@/lib/supabase";
import { setLibraryCookie } from "../auth-actions";


export async function createLibraryAction(data: {
	name: string;
	email: string;
	genres: number[];
	year_from: number;
	year_to: number;
	frequency: "daily" | "weekly";
	day_of_week?: number | null;
}) {
	const supabase = createClient();

	const { data: library, error } = await supabase
		.from("libraries")
		.insert(data)
		.select()
		.single();

	if (error || !library) {
		console.error("Error creating library:", error);
		throw new Error("No se pudo crear la biblioteca");
	}

	await setLibraryCookie(library.id);

	return library;
}
