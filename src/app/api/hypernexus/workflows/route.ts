import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/jwt';
import { triggerWorkflows, TRIGGER_EVENTS } from '@/lib/hypernexus/workflows';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const workflows = await prisma.workflow.findMany({
      where: { brokerageId: session.brokerageId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      workflows: workflows.map((w) => ({
        ...w,
        triggerCondition: w.triggerCondition ? JSON.parse(w.triggerCondition) : null,
        actions: JSON.parse(w.actions),
      })),
      triggerEvents: TRIGGER_EVENTS,
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, triggerEvent, triggerCondition, actions } = body;

    if (!name || !triggerEvent || !actions) {
      return NextResponse.json(
        { error: 'Name, triggerEvent, and actions are required' },
        { status: 400 }
      );
    }

    const workflow = await prisma.workflow.create({
      data: {
        brokerageId: session.brokerageId!,
        name,
        description: description || null,
        triggerEvent,
        triggerCondition: triggerCondition
          ? JSON.stringify(triggerCondition)
          : null,
        actions: JSON.stringify(actions),
      },
    });

    return NextResponse.json(
      {
        workflow: {
          ...workflow,
          triggerCondition: workflow.triggerCondition
            ? JSON.parse(workflow.triggerCondition)
            : null,
          actions: JSON.parse(workflow.actions),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}

/**
 * Test a workflow against a sample payload (without persisting side effects).
 */
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { workflow } = await request.json();
    // Only test with provided actions/condition — never persist
    const result = await triggerWorkflows({
      event: workflow.triggerEvent,
      brokerageId: session.brokerageId!,
      contactId: workflow.contactId,
      leadId: workflow.leadId,
      data: workflow.data || {},
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to test workflow' },
      { status: 500 }
    );
  }
}
