import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/jwt';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const campaigns = await prisma.campaign.findMany({
      where: { brokerageId: session.brokerageId },
      include: {
        steps: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
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
    const { name, description, type, channel, steps } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Campaign name is required' },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description: description || null,
        type: type || 'drip',
        channel: channel || 'email',
        brokerageId: session.brokerageId!,
        steps: {
          create: (steps || []).map(
            (s: {
              name: string;
              delayHours: number;
              channel: string;
              subject?: string;
              body: string;
              condition?: string;
            }, i: number) => ({
              name: s.name,
              order: i,
              delayHours: s.delayHours || 0,
              channel: s.channel || 'email',
              subject: s.subject || null,
              body: s.body,
              condition: s.condition || null,
            })
          ),
        },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
