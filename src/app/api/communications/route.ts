import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/jwt';
import { triggerWorkflows } from '@/lib/hypernexus/workflows';

/**
 * Record an inbound communication (e.g., a lead replied via SMS/email).
 * This fires HyperNexus "communication_received" workflows.
 *
 * Example: a lead replies "Yes" → workflow updates their stage to Hot.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { contactId, channel, body, subject } = await request.json();

    if (!contactId || !body) {
      return NextResponse.json(
        { error: 'contactId and body are required' },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, brokerageId: session.brokerageId },
      include: { lead: true },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const communication = await prisma.communication.create({
      data: {
        contactId,
        direction: 'inbound',
        channel: channel || 'sms',
        subject: subject || null,
        body,
        status: 'received',
      },
    });

    // Trigger HyperNexus workflows
    const workflowResult = await triggerWorkflows({
      event: 'communication_received',
      brokerageId: session.brokerageId!,
      contactId,
      leadId: contact.lead?.id,
      data: { body, channel: channel || 'sms' },
    });

    return NextResponse.json(
      { communication, workflows: workflowResult },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recording communication:', error);
    return NextResponse.json(
      { error: 'Failed to record communication' },
      { status: 500 }
    );
  }
}
