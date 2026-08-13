import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const contact = await prisma.contact.findUnique({
      where: { id, brokerageId: session.brokerageId },
      include: {
        lead: {
          include: { stage: true, pipeline: true },
        },
        assignedAgent: {
          select: { id: true, user: { select: { name: true, email: true } } },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        communications: {
          orderBy: { sentAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Parse tags from JSON string
    return NextResponse.json({
      ...contact,
      tags: JSON.parse(contact.tags),
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

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
    const { tags, ...contactData } = body;

    // Verify ownership
    const existing = await prisma.contact.findUnique({
      where: { id, brokerageId: session.brokerageId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...contactData,
        ...(tags !== undefined && { tags: JSON.stringify(tags) }),
      },
      include: {
        lead: { include: { stage: true } },
      },
    });

    // Log activity for changes
    await prisma.activity.create({
      data: {
        contactId: contact.id,
        type: 'note',
        description: `Contact updated: ${Object.keys(body).join(', ')}`,
      },
    });

    return NextResponse.json({ contact });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
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
    const existing = await prisma.contact.findUnique({
      where: { id, brokerageId: session.brokerageId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    await prisma.contact.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
