import type { MediaType } from "@/config/media";
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
		// Memoized by Inngest, so re-invocations see the same set of jobs:
		// one per ENABLED media type of every profile whose delivery day is today.
		const jobs = await step.run("load-jobs", async () => {
			const supabase = createClient();
			const today = new Date().getUTCDay();

			const { data: profiles } = await supabase
				.from("profiles")
				.select("id")
				.eq("day_of_week", today);

			const ids = (profiles ?? []).map((p: { id: string }) => p.id);
			if (ids.length === 0) return [];

			const { data: prefs } = await supabase
				.from("profile_preferences")
				.select("profile_id, media_type")
				.in("profile_id", ids)
				.eq("enabled", true);

			return (prefs ?? []) as { profile_id: string; media_type: MediaType }[];
		});

		for (const job of jobs) {
			await step.run(
				`process-${job.profile_id}-${job.media_type}`,
				async () => {
					const result = await createRecommendationForProfile(
						createClient(),
						job.profile_id,
						job.media_type,
					);
					if (!result.ok) {
						console.error(
							`Recommendation failed for ${job.media_type} of profile ${job.profile_id}: ${result.reason}`,
						);
					}
				},
			);
		}

		return { processed: jobs.length };
	},
);
