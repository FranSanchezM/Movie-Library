import { Inngest } from "inngest";
import { createRecommendationForProfile } from "./recommendations";
// The service-role client is only for this background job.
import { createClient } from "./supabase";

export const inngest = new Inngest({ id: "movie-library" });

// ─────────────────────────────────────────────
// CRON: Weekly — runs every day at 9am UTC but only processes the profiles
// whose delivery day (Saturday = 6 or Sunday = 0) is today (UTC)
// ─────────────────────────────────────────────
export const weeklyRecommendation = inngest.createFunction(
	{
		id: "weekly-recommendation",
		triggers: [{ cron: "0 9 * * *" }],
	},
	async ({ step }) => {
		// Memoized by Inngest, so re-invocations see the same set of profiles
		const profiles = await step.run("load-profiles", async () => {
			const supabase = createClient();
			const today = new Date().getUTCDay();

			const { data } = await supabase
				.from("profiles")
				.select("id")
				.eq("day_of_week", today);

			return (data ?? []) as { id: string }[];
		});

		for (const profile of profiles) {
			await step.run(`process-profile-${profile.id}`, async () => {
				const result = await createRecommendationForProfile(
					createClient(),
					profile.id,
				);
				if (!result.ok) {
					console.error(
						`Recommendation failed for profile ${profile.id}: ${result.reason}`,
					);
				}
			});
		}

		return { processed: profiles.length };
	},
);
