import { getCurrentProfile, getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
	const profile = await getCurrentProfile();

	if (!profile) {
		redirect((await getCurrentUser()) ? "/onboarding" : "/login");
	}

	return <SettingsForm profile={profile} />;
}
