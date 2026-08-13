import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/jwt';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.workflow.findUnique({
      where: { id, brokerageId: session.brokerageId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, triggerEvent, triggerCondition, actions, status } =
      body;

    const workflow = await prisma.workflow.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(triggerEvent !== undefined && { triggerEvent }),
        ...(triggerCondition !== undefined && {
          triggerCondition: triggerCondition ? JSON.stringify(triggerCondition) : null,
        }),
        ...(actions !== undefined && { actions: JSON.stringify(actions) }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json({
      workflow: {
        ...workflow,
        triggerCondition: workflow.triggerCondition
          ? JSON.parse(workflow.triggerCondition)
          : null,
        actions: JSON.parse(workflow.actions),
      },
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.workflow.findUnique({
      where: { id, brokerageId: session.brokerageId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    await prisma.workflow.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
