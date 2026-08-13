import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/jwt';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pipelines = await prisma.pipeline.findMany({
      where: { brokerageId: session.brokerageId },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ pipelines });
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipelines' },
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
    const { name, stages } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Pipeline name is required' },
        { status: 400 }
      );
    }

    const pipeline = await prisma.pipeline.create({
      data: {
        name,
        brokerageId: session.brokerageId!,
        isDefault: false,
        stages: {
          create: (stages || []).map(
            (s: { name: string; color?: string }, i: number) => ({
              name: s.name,
              color: s.color || '#6b7280',
              order: i,
            })
          ),
        },
      },
      include: { stages: { orderBy: { order: 'asc' } } },
    });

    return NextResponse.json({ pipeline }, { status: 201 });
  } catch (error) {
    console.error('Error creating pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to create pipeline' },
      { status: 500 }
    );
  }
}
