import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/jwt';
import { triggerWorkflows } from '@/lib/hypernexus/workflows';

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
    const { status, stageId, pipelineId, score, notes } = body;

    // Verify lead exists and belongs to user's brokerage
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        contact: { select: { brokerageId: true, id: true } },
      },
    });

    if (!lead || lead.contact.brokerageId !== session.brokerageId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (stageId) updateData.stageId = stageId;
    if (pipelineId) updateData.pipelineId = pipelineId;
    if (score !== undefined) updateData.score = score;
    if (status || stageId) updateData.lastContacted = new Date();

    const updated = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        stage: true,
        pipeline: true,
      },
    });

    // Log activity
    const changes = Object.keys(updateData)
      .filter((k) => k !== 'lastContacted')
      .join(', ');
    await prisma.activity.create({
      data: {
        contactId: lead.contact.id,
        type: 'status_change',
        description: `Lead updated: ${changes}${notes ? ` — ${notes}` : ''}`,
      },
    });

    // Trigger HyperNexus workflows
    await triggerWorkflows({
      event: 'lead_updated',
      brokerageId: session.brokerageId!,
      contactId: lead.contact.id,
      leadId: id,
      data: { status: status || '', stageId: stageId || '' },
    });

    return NextResponse.json({ lead: updated });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}
