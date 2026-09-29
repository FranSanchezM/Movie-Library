import { createUserClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// OAuth redirect target: exchanges the code for a session, then links a
// legacy profile with the same verified email (if any).
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

	// No-op when the user already has a profile or nothing matches.
	const { error: claimError } = await supabase.rpc("claim_legacy_profile");
	if (claimError) {
		console.error("Error claiming legacy profile:", claimError);
	}

	// "/" sends users without a profile to onboarding.
	return NextResponse.redirect(`${origin}/`);
}
