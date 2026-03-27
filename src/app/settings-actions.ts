"use server";

import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function updateLibrarySettings(
	id: string,
	data: { receives_emails?: boolean },
) {
	const supabase = createClient();
	const { error } = await supabase.from("libraries").update(data).eq("id", id);

	if (error) {
		console.error("Error updating library:", error);
		throw new Error("No se pudo actualizar la configuración");
	}

	revalidatePath("/");
}

export async function deleteLibraryAction(id: string) {
	const supabase = createClient();
	const { error } = await supabase.from("libraries").delete().eq("id", id);

	if (error) {
		console.error("Error deleting library:", error);
		throw new Error("No se pudo borrar la biblioteca");
	}

	const cookieStore = await cookies();
	const activeId = cookieStore.get("cinerandom_library_id")?.value;
	
	if (activeId === id) {
		cookieStore.delete("cinerandom_library_id");
	}

	return { success: true };
}
