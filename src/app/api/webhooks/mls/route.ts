import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { applyListingStatusChange } from '@/lib/listing-sync';

/**
 * Real-time MLS / Realcomp status push.
 *
 * Configure your MLS provider to POST here whenever a listing status changes:
 *
 *   POST /api/webhooks/mls
 *   Header: x-mls-secret: <MLS_WEBHOOK_SECRET>
 *   Body: { "mlsNumber": "12345", "status": "Expired" }
 *         or { "address": "123 Main St", "city": "Detroit", "status": "Active" }
 *
 * This updates the property + linked lead, writes the audit log, and fires
 * `listing_status_changed` workflows — in real time.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.MLS_WEBHOOK_SECRET;
  if (secret) {
    const provided = request.headers.get('x-mls-secret');
    if (provided !== secret) {
      return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
    }
  }

  const body = await request.json().catch(() => ({}));
  const mlsNumber = typeof body.mlsNumber === 'string' ? body.mlsNumber.trim() : undefined;
  const address = typeof body.address === 'string' ? body.address.trim() : undefined;
  const city = typeof body.city === 'string' ? body.city.trim() : undefined;
  const propertyId = typeof body.propertyId === 'string' ? body.propertyId : undefined;
  const status = typeof body.status === 'string' ? body.status.trim() : '';

  if (!status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 });
  }
  if (!mlsNumber && !propertyId && !address) {
    return NextResponse.json(
      { error: 'mlsNumber, propertyId, or address is required' },
      { status: 400 }
    );
  }

  // Resolve to a property id when only an address was provided.
  let resolvedPropertyId = propertyId;
  if (!resolvedPropertyId && address) {
    const match = await prisma.property.findFirst({
      where: city ? { address: { contains: address }, city: { contains: city } } : { address: { contains: address } },
      select: { id: true },
    });
    resolvedPropertyId = match?.id;
    if (!resolvedPropertyId) {
      return NextResponse.json(
        { error: `No property found matching address "${address}"` },
        { status: 404 }
      );
    }
  }

  const provider = typeof body.provider === 'string' ? body.provider.trim() : undefined;
  const result = await applyListingStatusChange({
    propertyId: resolvedPropertyId,
    mlsNumber: mlsNumber,
    newRawStatus: status,
    source: body.source ? String(body.source) : provider ? `webhook:${provider}` : 'webhook',
    rawPayload: body,
  });

  return NextResponse.json({ ...result, provider: 'mls-webhook' });
}
