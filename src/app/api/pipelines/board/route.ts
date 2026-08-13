import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/jwt';

/**
 * Returns leads organized by pipeline stage for the kanban board.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pipeline = await prisma.pipeline.findFirst({
      where: { brokerageId: session.brokerageId, isDefault: true },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            leads: {
              include: {
                contact: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
              orderBy: { updatedAt: 'desc' },
            },
          },
        },
      },
    });

    if (!pipeline) {
      return NextResponse.json({ stages: [], pipeline: null });
    }

    return NextResponse.json({
      pipeline: { id: pipeline.id, name: pipeline.name },
      stages: pipeline.stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        color: stage.color,
        order: stage.order,
        leads: stage.leads.map((lead) => ({
          id: lead.id,
          status: lead.status,
          score: lead.score,
          budgetMin: lead.budgetMin,
          budgetMax: lead.budgetMax,
          timeline: lead.timeline,
          contact: lead.contact,
        })),
      })),
    });
  } catch (error) {
    console.error('Error fetching kanban board:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kanban board' },
      { status: 500 }
    );
  }
}
