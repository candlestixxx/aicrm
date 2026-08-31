import prisma from '@/lib/db/prisma';
import { triggerWorkflows } from '@/lib/hypernexus/workflows';
import { getListingProviders } from '@/lib/listing-providers';
import {
  mapListingStatusToLeadStatus,
  normalizeListingStatus,
} from '@/lib/listing-status';

export interface StatusChangeResult {
  changed: boolean;
  propertyId?: string;
  previousStatus?: string;
  newStatus?: string;
  message: string;
}

/**
 * Apply a listing-status change to a property.
 *
 * This is the single entry point used by:
 *   - the real-time webhook (/api/webhooks/mls)
 *   - manual updates (/api/listings/sync)
 *   - the daily import job
 *   - the polling sync (provider adapters)
 *
 * When a status changes it:
 *   1. normalizes the raw provider status
 *   2. updates the Property (status, mlsStatus, source, lastSyncedAt)
 *   3. writes a ListingStatusLog entry (audit trail)
 *   4. re-maps the linked lead's status for campaign routing
 *   5. logs an Activity on the linked contact
 *   6. fires any `listing_status_changed` workflows
 */
export async function applyListingStatusChange(input: {
  propertyId?: string;
  mlsNumber?: string;
  newRawStatus: string;
  source: string;
  rawPayload?: unknown;
}): Promise<StatusChangeResult> {
  const normalized = normalizeListingStatus(input.newRawStatus);
  if (!normalized) {
    return { changed: false, message: `Unknown listing status: "${input.newRawStatus}"` };
  }

  const property = await prisma.property.findFirst({
    where: input.propertyId
      ? { id: input.propertyId }
      : input.mlsNumber
        ? { mlsNumber: input.mlsNumber }
        : undefined,
    include: {
      contact: { include: { lead: true } },
    },
  });

  if (!property) {
    return {
      changed: false,
      message: `No property found${input.mlsNumber ? ` for MLS #${input.mlsNumber}` : ''}`,
    };
  }

  const previousStatus = property.status;

  // No change — just refresh the sync metadata.
  if (previousStatus === normalized) {
    await prisma.property.update({
      where: { id: property.id },
      data: { lastSyncedAt: new Date(), mlsStatus: input.newRawStatus, source: input.source },
    });
    return {
      changed: false,
      propertyId: property.id,
      previousStatus,
      newStatus: normalized,
      message: `No change — already "${normalized}".`,
    };
  }

  // 1) Update the property.
  await prisma.property.update({
    where: { id: property.id },
    data: {
      status: normalized,
      mlsStatus: input.newRawStatus,
      source: input.source,
      lastSyncedAt: new Date(),
    },
  });

  // 2) Audit trail.
  await prisma.listingStatusLog.create({
    data: {
      brokerageId: property.brokerageId,
      propertyId: property.id,
      mlsNumber: property.mlsNumber,
      address: `${property.address}, ${property.city}`,
      previousStatus,
      newStatus: normalized,
      source: input.source,
      rawPayload: input.rawPayload ? JSON.stringify(input.rawPayload) : null,
    },
  });

  // 3) Re-map the linked lead's status for campaign routing.
  let leadId: string | undefined;
  if (property.contact?.lead) {
    leadId = property.contact.lead.id;
    const leadStatus = mapListingStatusToLeadStatus(normalized);
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: leadStatus },
    });
  }

  // 4) Log an activity on the linked contact.
  if (property.contactId) {
    await prisma.activity.create({
      data: {
        contactId: property.contactId,
        type: 'status_change',
        description: `Listing status changed: ${previousStatus} → ${normalized} (via ${input.source}).`,
        metadata: JSON.stringify({
          mlsNumber: property.mlsNumber,
          address: property.address,
          previousStatus,
          newStatus: normalized,
        }),
      },
    });
  }

  // 5) Fire workflows.
  await triggerWorkflows({
    event: 'listing_status_changed',
    brokerageId: property.brokerageId,
    contactId: property.contactId || undefined,
    leadId,
    data: {
      status: normalized,
      previousStatus,
      mlsNumber: property.mlsNumber,
      address: property.address,
      city: property.city,
      state: property.state,
      listPrice: property.listPrice,
    },
  });

  return {
    changed: true,
    propertyId: property.id,
    previousStatus,
    newStatus: normalized,
    message: `Updated "${property.address}" from ${previousStatus} → ${normalized}.`,
  };
}

// ─── Provider adapters (see src/lib/listing-providers.ts) ────────

/** Poll every property via its configured MLS provider and apply changes. */
export async function syncAllListings(brokerageId: string) {
  const providers = getListingProviders();
  const properties = await prisma.property.findMany({
    where: { brokerageId, mlsNumber: { not: null } },
    select: { id: true, mlsNumber: true, address: true, mlsProvider: true },
  });

  const results: StatusChangeResult[] = [];
  let checked = 0;
  let changed = 0;

  for (const prop of properties) {
    const provider = prop.mlsProvider ? providers[prop.mlsProvider] : undefined;
    if (!provider) {
      results.push({
        changed: false,
        propertyId: prop.id,
        message: `Skipped ${prop.mlsNumber}: no provider${prop.mlsProvider ? ` "${prop.mlsProvider}"` : ''} configured`,
      });
      continue;
    }

    try {
      const raw = await provider.fetchStatus(prop.mlsNumber!, prop.address);
      if (raw) {
        checked++;
        const result = await applyListingStatusChange({
          propertyId: prop.id,
          newRawStatus: raw,
          source: `provider:${provider.id}`,
        });
        results.push(result);
        if (result.changed) changed++;
      } else {
        results.push({
          changed: false,
          propertyId: prop.id,
          message: `No status returned from ${provider.name} for ${prop.mlsNumber}`,
        });
      }
    } catch (err) {
      results.push({
        changed: false,
        propertyId: prop.id,
        message: `Error checking ${prop.mlsNumber}: ${err instanceof Error ? err.message : 'unknown'}`,
      });
    }
  }

  return { providers: Object.keys(providers), checked, changed, results };
}
