"use server";

import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function updateRecommendationFeedback(
	id: string,
	data: { is_seen?: boolean; feedback?: "liked" | "disliked" | null },
) {
	const supabase = createClient();
	const { error } = await supabase
		.from("recommendations")
		.update(data)
		.eq("id", id);

	if (error) {
		console.error("Error actualizando recomendación:", error);
		throw new Error("No se pudo actualizar la recomendación");
	}

	revalidatePath("/");
}

export async function deleteRecommendationAction(id: string) {
	const supabase = createClient();
	const { error } = await supabase.from("recommendations").delete().eq("id", id);

	if (error) {
		console.error("Error borrando recomendación:", error);
		throw new Error("No se pudo borrar la recomendación");
	}

	revalidatePath("/");
}
