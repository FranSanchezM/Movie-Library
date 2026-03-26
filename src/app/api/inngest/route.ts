import { serve } from "inngest/next";
import {
	dailyRecommendation,
	inngest,
	weeklyRecommendation,
} from "../../../lib/inngest";

export const { GET, POST, PUT } = serve({
	client: inngest,
	functions: [dailyRecommendation, weeklyRecommendation],
});
