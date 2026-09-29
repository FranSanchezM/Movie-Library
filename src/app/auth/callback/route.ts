import { ensureProfile } from "@/lib/profile-bootstrap";
import { createUserClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// OAuth redirect target: exchanges the code for a session, then makes sure the
// user has a profile (claiming a legacy one by verified email, or creating a
// base one) and sends them Home.
export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");

	if (!code) {
		return NextResponse.redirect(`${origin}/login?error=auth`);
	}

	const supabase = await createUserClient();
	const { error } = await supabase.auth.exchangeCodeForSession(code);

	if (error) {
		console.error("Auth callback error:", error);
		return NextResponse.redirect(`${origin}/login?error=auth`);
	}

	const { data } = await supabase.auth.getUser();
	if (data.user) {
		await ensureProfile(supabase, data.user);
	}

	return NextResponse.redirect(`${origin}/`);
}
