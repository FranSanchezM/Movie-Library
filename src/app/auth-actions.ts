"use server";

import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(email: string) {
	const supabase = createClient();
	const { data } = await supabase
		.from("libraries")
		.select("id")
		.eq("email", email.trim())
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (!data) {
		throw new Error("No encontramos una biblioteca con ese email.");
	}

	const cookieStore = await cookies();
	cookieStore.set("cinerandom_library_id", data.id, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		maxAge: 60 * 60 * 24 * 365, // 1 year
		path: "/",
	});

	redirect("/");
}

export async function logoutAction() {
	const cookieStore = await cookies();
	cookieStore.delete("cinerandom_library_id");
	redirect("/onboarding");
}

export async function setLibraryCookie(id: string) {
	const cookieStore = await cookies();
	cookieStore.set("cinerandom_library_id", id, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		maxAge: 60 * 60 * 24 * 365, // 1 year
		path: "/",
	});
}
