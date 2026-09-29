import { getCurrentPreferences, getCurrentProfile } from "@/lib/session";
import { redirect } from "next/navigation";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
	const profile = await getCurrentProfile();

	if (!profile) {
		redirect("/login");
	}

	return (
		<SettingsForm
			profile={profile}
			preferences={await getCurrentPreferences()}
		/>
	);
}
