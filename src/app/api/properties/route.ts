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
  const propertyType = searchParams.get('propertyType');
  const city = searchParams.get('city');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');

  const where: Record<string, unknown> = {
    brokerageId: session.brokerageId,
  };
  if (status) where.status = status;
  if (propertyType) where.propertyType = propertyType;
  if (city) where.city = { contains: city };

  try {
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          listingAgent: {
            select: {
              id: true,
              user: { select: { name: true, email: true } },
            },
          },
          images: { orderBy: { order: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
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
      mlsNumber,
      address,
      city,
      state,
      zip,
      propertyType,
      listPrice,
      bedrooms,
      bathrooms,
      squareFeet,
      lotSize,
      yearBuilt,
      description,
      status,
      listingAgentId,
      contactId,
      source,
      mlsStatus,
    } = body;

    if (!address || !city || !state) {
      return NextResponse.json(
        { error: 'Address, city, and state are required' },
        { status: 400 }
      );
    }

    const property = await prisma.property.create({
      data: {
        brokerageId: session.brokerageId!,
        mlsNumber: mlsNumber || null,
        address,
        city,
        state,
        zip: zip || '',
        propertyType: propertyType || 'single_family',
        listPrice: listPrice || null,
        bedrooms: bedrooms || null,
        bathrooms: bathrooms || null,
        squareFeet: squareFeet || null,
        lotSize: lotSize || null,
        yearBuilt: yearBuilt || null,
        description: description || null,
        status: status || 'active',
        listingAgentId: listingAgentId || session.agentId,
        contactId: contactId || null,
        source: source || 'manual',
        mlsStatus: mlsStatus || status || 'active',
      },
      include: { images: true },
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  }
}
