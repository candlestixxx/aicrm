import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/jwt';
import { applyListingStatusChange, syncAllListings } from '@/lib/listing-sync';
import { LISTING_STATUS_META } from '@/lib/listing-status';

/** Live reporting: recent status changes + current listing-status breakdown. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const brokerageId = session.brokerageId!;

  const [log, counts, listings] = await Promise.all([
    prisma.listingStatusLog.findMany({
      where: { brokerageId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.property.groupBy({
      by: ['status'],
      where: { brokerageId },
      _count: true,
    }),
    prisma.property.findMany({
      where: { brokerageId },
      select: { id: true, address: true, city: true, mlsNumber: true, status: true, lastSyncedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    log,
    totalListings: listings.length,
    listings,
    byStatus: counts.map((c) => ({
      status: c.status,
      count: c._count,
      meta: LISTING_STATUS_META.find((m) => m.value === c.status),
    })),
  });
}

/**
 * Manual sync.
 *   POST { propertyId, status }  → manually correct a listing's status
 *   POST { syncAll: true }        → poll the configured MLS provider for every listing
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  if (body.syncAll) {
    const summary = await syncAllListings(session.brokerageId!);
    return NextResponse.json(summary);
  }

  if (!body.propertyId || typeof body.status !== 'string') {
    return NextResponse.json(
      { error: 'propertyId and status are required (or pass syncAll: true)' },
      { status: 400 }
    );
  }

  const result = await applyListingStatusChange({
    propertyId: body.propertyId,
    newRawStatus: body.status,
    source: body.source ? String(body.source) : 'manual',
  });

  return NextResponse.json(result);
}
