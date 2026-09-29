"use server";

import { createUserClient } from "@/lib/supabase-server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function getOrigin(): Promise<string> {
	const h = await headers();
	const origin = h.get("origin");
	if (origin) return origin;
	const host = h.get("x-forwarded-host") ?? h.get("host");
	const proto = h.get("x-forwarded-proto") ?? "http";
	return `${proto}://${host}`;
}

export async function signInWithGoogleAction() {
	const supabase = await createUserClient();
	const origin = await getOrigin();

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: { redirectTo: `${origin}/auth/callback` },
	});

	if (error || !data.url) {
		console.error("Google sign-in error:", error);
		redirect("/login?error=auth");
	}

	redirect(data.url);
}

export async function logoutAction() {
	const supabase = await createUserClient();
	await supabase.auth.signOut();
	redirect("/login");
}
