import { inngest } from "../client";

export const campaignScheduler = inngest.createFunction(
  { id: "campaign-scheduler" },
  { cron: "0 * * * *" }, // Run every hour
  async ({ step }) => {
    // 1. Fetch pending CampaignExecutionLog entries
    const pendingSteps = await step.run("fetch-pending-campaigns", async () => {
      // Prisma call would go here
      return []; 
    });

    // 2. Dispatch sub-events for each to execute them in parallel
    const events = pendingSteps.map((step: any) => ({
      name: "campaign/execute.step",
      data: { executionLogId: step.id }
    }));

    if (events.length > 0) {
      await step.sendEvent("dispatch-campaign-steps", events);
    }

    return { processed: events.length };
  }
);
