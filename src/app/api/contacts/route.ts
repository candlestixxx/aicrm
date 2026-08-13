import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/jwt';
import { triggerWorkflows } from '@/lib/hypernexus/workflows';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status'); // lead status filter
  const tag = searchParams.get('tag');
  const source = searchParams.get('source');
  const assignedTo = searchParams.get('assignedTo');
  const sort = searchParams.get('sort') || 'createdAt';
  const order = searchParams.get('order') || 'desc';

  const where: Record<string, unknown> = {
    brokerageId: session.brokerageId,
  };

  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { city: { contains: search } },
      { tags: { contains: search } },
    ];
  }

  if (source) where.source = source;
  if (assignedTo) where.assignedAgentId = assignedTo;

  // Lead-specific filters via the lead relation
  const leadWhere: Record<string, unknown> = {};
  if (status) leadWhere.status = status;

  if (Object.keys(leadWhere).length > 0) {
    where.lead = leadWhere;
  }

  if (tag) {
    // SQLite doesn't have native JSON contains — filter in memory for small datasets
    // For production PostgreSQL, use jsonb operators
  }

  try {
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          lead: {
            include: {
              stage: true,
              pipeline: true,
            },
          },
          assignedAgent: {
            select: { id: true, user: { select: { name: true, email: true } } },
          },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
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
    const {
      firstName,
      lastName,
      email,
      phone,
      phone2,
      address,
      city,
      state,
      zip,
      source,
      tags,
      notes,
      isLead,
      // Lead fields
      status: leadStatus,
      budgetMin,
      budgetMax,
      propertyType,
      timeline,
      pipelineId,
      stageId,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Get default pipeline if creating a lead
    let resolvedPipelineId = pipelineId;
    let resolvedStageId = stageId;

    if (isLead && !resolvedPipelineId) {
      const defaultPipeline = await prisma.pipeline.findFirst({
        where: { brokerageId: session.brokerageId, isDefault: true },
        include: { stages: { orderBy: { order: 'asc' }, take: 1 } },
      });
      if (defaultPipeline) {
        resolvedPipelineId = defaultPipeline.id;
        resolvedStageId = defaultPipeline.stages[0]?.id;
      }
    }

    const contact = await prisma.contact.create({
      data: {
        brokerageId: session.brokerageId!,
        assignedAgentId: session.agentId,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        phone2: phone2 || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        source: source || null,
        tags: tags ? JSON.stringify(tags) : '[]',
        notes: notes || null,
        isLead: isLead || false,
        ...(isLead && {
          lead: {
            create: {
              status: leadStatus || 'new',
              budgetMin: budgetMin || null,
              budgetMax: budgetMax || null,
              propertyType: propertyType || null,
              timeline: timeline || null,
              pipelineId: resolvedPipelineId,
              stageId: resolvedStageId,
            },
          },
        }),
      },
      include: {
        lead: { include: { stage: true } },
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        contactId: contact.id,
        type: 'note',
        description: 'Contact created',
      },
    });

    // Trigger HyperNexus workflows
    const lead = contact.isLead ? contact.lead : null;
    await triggerWorkflows({
      event: contact.isLead ? 'lead_created' : 'contact_created',
      brokerageId: session.brokerageId!,
      contactId: contact.id,
      leadId: lead?.id,
      data: { source: contact.source || '', firstName: contact.firstName },
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
