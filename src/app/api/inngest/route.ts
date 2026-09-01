import { serve } from "inngest/next";
import { inngest } from "../../../lib/inngest/client";
import { agentScraper } from "../../../lib/inngest/functions/agent-scraper";
import { campaignScheduler } from "../../../lib/inngest/functions/campaign-scheduler";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    agentScraper,
    campaignScheduler,
  ],
});
