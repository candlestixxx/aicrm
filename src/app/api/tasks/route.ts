import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const contactId = searchParams.get('contactId');
  const overdue = searchParams.get('overdue') === 'true';

  const where: Record<string, unknown> = {
    agentId: session.agentId,
  };

  if (status) where.status = status;
  if (type) where.type = type;
  if (contactId) where.contactId = contactId;
  if (overdue) {
    where.dueDate = { lt: new Date() };
    where.status = { not: 'completed' };
  }

  try {
    const tasks = await prisma.task.findMany({
      where,
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { priority: 'asc' }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
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
    const { title, description, dueDate, priority, type, contactId } =
      await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        agentId: session.agentId!,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        type: type || 'follow_up',
        contactId: contactId || null,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
