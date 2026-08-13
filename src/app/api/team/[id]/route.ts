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
    const body = await request.json();
    const { teamId, commissionSplit, title, role } = body;

    // Verify the agent belongs to the same brokerage
    const existing = await prisma.agent.findUnique({
      where: { id, brokerageId: session.brokerageId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = await prisma.agent.update({
      where: { id },
      data: {
        ...(teamId !== undefined && { teamId: teamId || null }),
        ...(commissionSplit !== undefined && { commissionSplit }),
        ...(title !== undefined && { title }),
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        team: true,
      },
    });

    // If role provided, update the user role too
    if (role && agent.user) {
      await prisma.user.update({
        where: { id: agent.user.id },
        data: { role },
      });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { error: 'Failed to update agent' },
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
    const existing = await prisma.agent.findUnique({
      where: { id, brokerageId: session.brokerageId },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Don't allow deleting yourself
    if (id === session.agentId) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from the brokerage' },
        { status: 400 }
      );
    }

    // Delete agent profile (cascades to user via relation)
    await prisma.agent.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing agent:', error);
    return NextResponse.json(
      { error: 'Failed to remove agent' },
      { status: 500 }
    );
  }
}
