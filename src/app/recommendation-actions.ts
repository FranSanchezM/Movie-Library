"use server";

import { isUuid, requireProfile } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateRecommendationFeedback(
	id: string,
	data: { is_seen?: boolean; feedback?: "liked" | "disliked" | null },
) {
	const { supabase, profile } = await requireProfile();
	if (!isUuid(id)) throw new Error("Solicitud inválida");

	const update: { is_seen?: boolean; feedback?: "liked" | "disliked" | null } =
		{};
	if (typeof data.is_seen === "boolean") update.is_seen = data.is_seen;
	if (
		data.feedback === null ||
		data.feedback === "liked" ||
		data.feedback === "disliked"
	) {
		update.feedback = data.feedback;
	}

	const { error } = await supabase
		.from("recommendations")
		.update(update)
		.eq("id", id)
		.eq("profile_id", profile.id);

	if (error) {
		console.error("Error actualizando recomendación:", error);
		throw new Error("No se pudo actualizar la recomendación");
	}

	revalidatePath("/");
}

export async function deleteRecommendationAction(id: string) {
	const { supabase, profile } = await requireProfile();
	if (!isUuid(id)) throw new Error("Solicitud inválida");

	const { error } = await supabase
		.from("recommendations")
		.delete()
		.eq("id", id)
		.eq("profile_id", profile.id);

	if (error) {
		console.error("Error borrando recomendación:", error);
		throw new Error("No se pudo borrar la recomendación");
	}

	revalidatePath("/");
}
