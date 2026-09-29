import { getCurrentProfile, getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import OnboardingForm from "./onboarding-form";

// One profile per user: only reachable when signed in and without a profile.
export default async function OnboardingPage() {
	if (!(await getCurrentUser())) {
		redirect("/login");
	}
	if (await getCurrentProfile()) {
		redirect("/");
	}

	return <OnboardingForm />;
}
