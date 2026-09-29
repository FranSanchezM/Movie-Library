import { serve } from "inngest/next";
import { inngest, weeklyRecommendation } from "../../../lib/inngest";

export const { GET, POST, PUT } = serve({
	client: inngest,
	functions: [weeklyRecommendation],
});
