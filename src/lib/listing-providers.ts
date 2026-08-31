/**
 * MLS listing providers.
 *
 * Supports multiple MLSs at once (Realcomp, MiMLS/Paragon, or any HTTP/RETS
 * provider). Providers are configured entirely via environment variables and
 * are NEVER hardcoded with credentials.
 *
 *   MLS_PROVIDERS="realcomp,mimls"            # comma-separated provider ids
 *
 * For each id `<id>`, set (id is uppercased in the env key):
 *   MLS_<ID>_NAME="Realcomp"                  # display name (optional)
 *   MLS_<ID>_API_URL="https://..."            # base API / RETS endpoint
 *   MLS_<ID>_USERNAME="..."                   # login
 *   MLS_<ID>_PASSWORD="..."                   # password
 *   MLS_<ID>_LOOKUP_PATH="/listings/{mls}"    # path template; `{mls}` replaced
 *   MLS_<ID>_TYPE="http"                      # adapter type (http for now)
 *
 * NOTE for Paragon MLSs (e.g. MiMLS): the RETS/Web API endpoint is a
 * dedicated API URL provided by the MLS tech support — NOT the web login
 * page (…/ParagonLS/Default.mvc/Login).
 */

export interface ListingProvider {
  id: string;
  name: string;
  type: string;
  fetchStatus(mlsNumber: string, address?: string): Promise<string | null>;
}

export const noopProvider: ListingProvider = {
  id: 'none',
  name: 'None',
  type: 'none',
  async fetchStatus() {
    return null;
  },
};

interface ProviderConfig {
  id: string;
  name: string;
  apiUrl: string;
  username: string;
  password: string;
  lookupPath: string;
  type: string;
}

function providerEnv(id: string, key: string): string | undefined {
  return process.env[`MLS_${id.toUpperCase()}_${key}`];
}

function readProviderIds(): string[] {
  const raw = process.env.MLS_PROVIDERS || process.env.MLS_PROVIDER || '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function basicAuth(username: string, password: string): string {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}

function readConfig(id: string): ProviderConfig | null {
  const apiUrl = providerEnv(id, 'API_URL');
  const username = providerEnv(id, 'USERNAME');
  const password = providerEnv(id, 'PASSWORD');
  if (!apiUrl || !username || !password) return null;
  return {
    id,
    name: providerEnv(id, 'NAME') || id,
    apiUrl,
    username,
    password,
    lookupPath: providerEnv(id, 'LOOKUP_PATH') || '/listings/{mls}',
    type: (providerEnv(id, 'TYPE') || 'http').toLowerCase(),
  };
}

function makeHttpProvider(cfg: ProviderConfig): ListingProvider {
  return {
    id: cfg.id,
    name: cfg.name,
    type: cfg.type,
    async fetchStatus(mlsNumber) {
      const url =
        cfg.apiUrl.replace(/\/$/, '') +
        cfg.lookupPath.replace('{mls}', encodeURIComponent(mlsNumber));

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(url, {
          headers: {
            Authorization: basicAuth(cfg.username, cfg.password),
            Accept: 'application/json',
          },
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
}

/** Return every provider that is fully configured in the environment. */
export function getListingProviders(): Record<string, ListingProvider> {
  const providers: Record<string, ListingProvider> = {};
  for (const id of readProviderIds()) {
    const cfg = readConfig(id);
    if (cfg) providers[id] = makeHttpProvider(cfg);
  }
  return providers;
}

/** Get a single provider by id (falls back to noop). */
export function getListingProvider(id?: string | null): ListingProvider {
  if (!id) return noopProvider;
  const providers = getListingProviders();
  return providers[id] || noopProvider;
}

/** Lightweight metadata for the UI (ids + display names, no secrets). */
export function listConfiguredProviders(): { id: string; name: string; type: string }[] {
  const providers = getListingProviders();
  return Object.values(providers).map((p) => ({ id: p.id, name: p.name, type: p.type }));
}
