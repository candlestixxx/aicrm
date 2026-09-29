import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    const { tenantId, prompt } = await req.json();

    if (!tenantId || !prompt) {
      return NextResponse.json(
        { error: "tenantId and prompt are required" },
        { status: 400 }
      );
    }

    // Simulate LLM NLP parsing of the prompt into workflow logic
    // In a real scenario, this would route through HyperNexus to OpenAI/Gemini/etc.
    const mockParsedWorkflow = {
      name: `Automated Workflow from: "${prompt.substring(0, 30)}..."`,
      description: `Generated based on user intent: ${prompt}`,
      triggerType: "INCOMING_SMS",
      actionType: "UPDATE_STAGE",
      actionConfig: { stage: "Hot" },
    };

    // Save the parsed workflow to the database
    const workflow = await prisma.workflow.create({
      data: {
        tenantId,
        name: mockParsedWorkflow.name,
        description: mockParsedWorkflow.description,
        triggers: {
          create: {
            type: mockParsedWorkflow.triggerType,
          },
        },
        actions: {
          create: {
            type: mockParsedWorkflow.actionType,
            config: mockParsedWorkflow.actionConfig,
            orderIndex: 0,
          },
        },
      },
      include: {
        triggers: true,
        actions: true,
      },
    });

    return NextResponse.json({ success: true, workflow });
  } catch (error) {
    console.error("Failed to parse workflow:", error);
    return NextResponse.json(
      { error: "Failed to generate workflow from prompt" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const workflows = await prisma.workflow.findMany({
      where: { tenantId },
      include: { triggers: true, actions: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, workflows });
  } catch (error) {
    console.error("Failed to fetch workflows:", error);
    return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 });
  }
}
