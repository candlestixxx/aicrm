import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    const { tenantId, eventType, payload } = await req.json();

    if (!tenantId || !eventType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find active workflows listening for this event type
    const activeWorkflows = await prisma.workflow.findMany({
      where: {
        tenantId,
        isActive: true,
        triggers: {
          some: {
            type: eventType,
          },
        },
      },
      include: {
        actions: {
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
    });

    console.log(`Found ${activeWorkflows.length} active workflows for event: ${eventType}`);

    // In a real application, you would queue these actions in a job worker (e.g., Redis/BullMQ)
    // For now, we simulate executing the actions sequentially.
    for (const workflow of activeWorkflows) {
      console.log(`Executing workflow: ${workflow.name}`);
      for (const action of workflow.actions) {
        console.log(` -> Executing action: ${action.type}`, action.config);

        // Example logic for UPDATE_STAGE
        if (action.type === "UPDATE_STAGE" && payload.contactId) {
          const config = action.config as { stage?: string };
          if (config && config.stage) {
            await prisma.contact.update({
              where: { id: payload.contactId },
              data: { stage: config.stage },
            });
            console.log(`   Contact ${payload.contactId} updated to stage ${config.stage}`);
          }
        }
      }
    }

    return NextResponse.json({ success: true, executedWorkflows: activeWorkflows.length });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}
