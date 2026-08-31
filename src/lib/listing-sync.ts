import prisma from '@/lib/db/prisma';
import { triggerWorkflows } from '@/lib/hypernexus/workflows';
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

// ─── Provider adapters ──────────────────────────────────────────
export interface ListingProvider {
  name: string;
  /** Return the current raw status for a listing, or null if it cannot be checked. */
  fetchStatus(mlsNumber: string, address?: string): Promise<string | null>;
}

/**
 * RealComp / MLS providers expose a lookup API. Wire your credentials here
 * (or via an env-configured provider) and `syncAllListings` will poll them.
 *
 * TODO(integration): adjust the endpoint + response field names to match
 * your RealComp RESO Web API / RETS schema exactly.
 */
export const noopProvider: ListingProvider = {
  name: 'none',
  async fetchStatus() {
    return null;
  },
};

function basicAuth(username: string, password: string): string {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}

/**
 * RealComp provider adapter (stub).
 *
 * Env:
 *   MLS_PROVIDER=realcomp
 *   REALCOMP_API_URL=https://api.realcomp.example.com
 *   REALCOMP_USERNAME=...
 *   REALCOMP_PASSWORD=...
 *   REALCOMP_LOOKUP_PATH=/listings/{mls}   (optional, `{mls}` is replaced)
 *
 * Returns the raw listing status string, or null if the listing can't be
 * checked (bad creds, network error, etc.).
 */
export const realcompProvider: ListingProvider = {
  name: 'realcomp',
  async fetchStatus(mlsNumber) {
    const base = process.env.REALCOMP_API_URL;
    const username = process.env.REALCOMP_USERNAME;
    const password = process.env.REALCOMP_PASSWORD;
    if (!base || !username || !password) return null;

    const pathTemplate = process.env.REALCOMP_LOOKUP_PATH || '/listings/{mls}';
    const url = `${base.replace(/\/$/, '')}${pathTemplate.replace('{mls}', encodeURIComponent(mlsNumber))}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, {
        headers: { Authorization: basicAuth(username, password), Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return null;

      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const status =
        data.listingStatus ?? data.status ?? data.ListingStatus ?? data.listing_status;
      return typeof status === 'string' && status.trim() ? status : null;
    } catch {
      return null;
    }
  },
};

/** Select a provider from the environment (e.g. MLS_PROVIDER=realcomp). */
export function getListingProvider(): ListingProvider {
  const name = (process.env.MLS_PROVIDER || 'none').toLowerCase();
  switch (name) {
    case 'realcomp':
      return realcompProvider;
    default:
      return noopProvider;
  }
}

/** Poll every property and apply any status change. Returns a summary. */
export async function syncAllListings(brokerageId: string, provider?: ListingProvider) {
  const p = provider || getListingProvider();
  const properties = await prisma.property.findMany({
    where: { brokerageId, mlsNumber: { not: null } },
    select: { id: true, mlsNumber: true, address: true },
  });

  const results: StatusChangeResult[] = [];
  let checked = 0;
  let changed = 0;

  for (const prop of properties) {
    try {
      const raw = await p.fetchStatus(prop.mlsNumber!, prop.address);
      if (raw) {
        checked++;
        const result = await applyListingStatusChange({
          propertyId: prop.id,
          newRawStatus: raw,
          source: `provider:${p.name}`,
        });
        results.push(result);
        if (result.changed) changed++;
      }
    } catch (err) {
      results.push({
        changed: false,
        propertyId: prop.id,
        message: `Error checking ${prop.mlsNumber}: ${err instanceof Error ? err.message : 'unknown'}`,
      });
    }
  }

  return { provider: p.name, checked, changed, results };
}
