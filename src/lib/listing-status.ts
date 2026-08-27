/**
 * MLS / Realcomp listing-status taxonomy.
 *
 * Providers deliver statuses in many spellings (e.g. "Expired", "EXP",
 * "Unconditional Withdraw", "UCB", "Cancelled", "Back On Market").
 * We normalize them into a small, stable set that the CRM can act on
 * (campaigns, lead stage, workflows).
 */

export type ListingStatus =
  | 'active'
  | 'pending'
  | 'sold'
  | 'off_market'
  | 'expired'
  | 'canceled'
  | 'unconditional_withdraw'
  | 'conditional_withdraw';

export const LISTING_STATUSES: ListingStatus[] = [
  'active',
  'pending',
  'sold',
  'off_market',
  'expired',
  'canceled',
  'unconditional_withdraw',
  'conditional_withdraw',
];

export interface ListingStatusMeta {
  value: ListingStatus;
  label: string;
  color: string;
  description: string;
}

export const LISTING_STATUS_META: ListingStatusMeta[] = [
  { value: 'active', label: 'Active', color: '#16a34a', description: 'On the market and available.' },
  { value: 'pending', label: 'Pending', color: '#d97706', description: 'Under contract.' },
  { value: 'sold', label: 'Sold', color: '#2563eb', description: 'Closed / sold.' },
  { value: 'off_market', label: 'Off Market', color: '#6b7280', description: 'Temporarily off market / withdrawn.' },
  { value: 'expired', label: 'Expired', color: '#dc2626', description: 'Listing expired.' },
  { value: 'canceled', label: 'Canceled', color: '#dc2626', description: 'Listing canceled.' },
  { value: 'unconditional_withdraw', label: 'Unconditional Withdraw', color: '#9333ea', description: 'UCB — unconditional backup.' },
  { value: 'conditional_withdraw', label: 'Conditional Withdraw', color: '#7c3aed', description: 'CCB — conditional backup.' },
];

const STATUS_META_BY_VALUE = Object.fromEntries(
  LISTING_STATUS_META.map((m) => [m.value, m])
) as Record<ListingStatus, ListingStatusMeta>;

export function listingStatusMeta(status: string): ListingStatusMeta {
  return STATUS_META_BY_VALUE[status as ListingStatus] ?? {
    value: 'off_market',
    label: status,
    color: '#6b7280',
    description: '',
  };
}

/** Normalize a raw provider status string into a stable ListingStatus (or null). */
export function normalizeListingStatus(raw: string | null | undefined): ListingStatus | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();

  if (/^(active|act|back on market|bom|back-on-market)$/.test(s)) return 'active';
  if (/^(pending|p|under contract|contingent|pend)$/.test(s)) return 'pending';
  if (/^(sold|closed|close)$/.test(s)) return 'sold';
  if (/^(off market|off-market|withdrawn|temporarily off market|hold|temporarily-off-market)$/.test(s))
    return 'off_market';
  if (/^(expired|exp|expire)$/.test(s)) return 'expired';
  if (/^(canceled|cancelled|can|cancel)$/.test(s)) return 'canceled';
  if (/^(unconditional withdraw|unconditional-withdraw|ucb|unconditional|backup)$/.test(s))
    return 'unconditional_withdraw';
  if (/^(conditional withdraw|conditional-withdraw|ccb|conditional)$/.test(s))
    return 'conditional_withdraw';

  return null;
}

/**
 * Suggest a lead status from a listing status. Drives campaigns:
 *   - "back on market" → hot (re-engage now)
 *   - expired / canceled / withdrawn → new opportunity
 *   - sold → closed_won
 */
export function mapListingStatusToLeadStatus(status: ListingStatus): string {
  switch (status) {
    case 'active':
      return 'hot';
    case 'pending':
      return 'active';
    case 'sold':
      return 'closed_won';
    case 'off_market':
      return 'cold';
    case 'expired':
    case 'canceled':
    case 'unconditional_withdraw':
    case 'conditional_withdraw':
      return 'new';
    default:
      return 'new';
  }
}
