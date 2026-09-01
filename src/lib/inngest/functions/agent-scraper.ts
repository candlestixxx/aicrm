import { inngest } from "../client";

export const agentScraper = inngest.createFunction(
  { id: "agent-scraper", triggers: [{ event: "agent/enrich.lead" }] },
  async ({ event, step }) => {
    const { contactId, email, website } = event.data;

    // Simulate scraping and reasoning that takes minutes
    await step.sleep("wait-for-scraping", "2m");

    const enrichedData = await step.run("fetch-enrichment-data", async () => {
      // Simulate external API call
      return {
        linkedin: "https://linkedin.com/in/simulated",
        company: "Simulated Corp",
        title: "Director"
      };
    });

    await step.run("update-database", async () => {
      // Update Prisma with enriched data
      console.log(`Updated lead ${contactId} with ${JSON.stringify(enrichedData)}`);
    });

    return { success: true, enrichedData };
  }
);
