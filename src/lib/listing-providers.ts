/**
 * MLS listing providers (multi-MLS).
 *
 * Two adapter types:
 *   - `http` — generic basic-auth JSON lookup (RESO Web API style)
 *   - `rets` — full RETS login + DMQL search (Paragon / Realcomp style)
 *
 * Providers are configured entirely via environment variables (never with
 * hardcoded credentials).
 *
 *   MLS_PROVIDERS="realcomp,mimls"
 *
 * Common (all types):
 *   MLS_<ID>_NAME       display name
 *   MLS_<ID>_TYPE       http | rets
 *   MLS_<ID>_API_URL    base URL (http) or full RETS login URL (rets)
 *   MLS_<ID>_USERNAME   account login
 *   MLS_<ID>_PASSWORD   account password
 *
 * http type:
 *   MLS_<ID>_LOOKUP_PATH   path template; `{mls}` is replaced
 *
 * rets type (Paragon/Realcomp RETS):
 *   MLS_<ID>_UA             RETS user-agent string (e.g. "AiCRM/1.0")
 *   MLS_<ID>_UA_PASSWORD    RETS user-agent password (assigned by the MLS)
 *   MLS_<ID>_RETS_VERSION   e.g. "RETS/1.7.2"
 *   MLS_<ID>_SEARCH_RESOURCE   e.g. "Property"
 *   MLS_<ID>_SEARCH_CLASS      e.g. "RES"
 *   MLS_<ID>_SEARCH_QUERY_FIELD  e.g. "MLNumber" or "ListingKey"
 *   MLS_<ID>_STATUS_FIELD       e.g. "Status" or "ListingStatus"
 *
 * IMPORTANT for Paragon MLSs (MiMLS): the RETS login URL is a dedicated API
 * URL issued by MiMLS tech support — NOT the web login page. RETS also
 * usually uses a SEPARATE "user-agent password", not your web portal password.
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
  // rets-specific
  ua?: string;
  uaPassword?: string;
  retsVersion?: string;
  searchResource?: string;
  searchClass?: string;
  queryField?: string;
  statusField?: string;
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
    ua: providerEnv(id, 'UA') || 'AiCRM/1.0',
    uaPassword: providerEnv(id, 'UA_PASSWORD') || password,
    retsVersion: providerEnv(id, 'RETS_VERSION') || 'RETS/1.7.2',
    searchResource: providerEnv(id, 'SEARCH_RESOURCE') || 'Property',
    searchClass: providerEnv(id, 'SEARCH_CLASS') || 'RES',
    queryField: providerEnv(id, 'SEARCH_QUERY_FIELD') || 'MLNumber',
    statusField: providerEnv(id, 'STATUS_FIELD') || 'Status',
  };
}

// ─── HTTP provider (RESO Web API / generic JSON) ──────────────
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

// ─── RETS provider (Paragon / Realcomp) ───────────────────────
function retsHeaders(cfg: ProviderConfig, cookie?: string): Record<string, string> {
  const ua = cfg.ua || 'AiCRM/1.0';
  const headers: Record<string, string> = {
    'RETS-Version': cfg.retsVersion || 'RETS/1.7.2',
    'User-Agent': ua,
    // Basic User-Agent auth. If MiMLS requires DIGEST UA auth instead, this
    // is the one line to swap — see note in README/help (or use rets-client).
    'RETS-UA-Authorization': basicAuth(ua, cfg.uaPassword || cfg.password),
    Accept: '*/*',
  };
  if (cookie) headers.Cookie = cookie;
  return headers;
}

/** Pull a capability URL out of a RETS login response body. */
function extractCapability(xml: string, name: string): string | null {
  const m = xml.match(new RegExp(`${name}\\s*=\\s*(\\S+)`));
  return m ? m[1].trim() : null;
}

/** Pull the status value out of a COMPACT-DECODED RETS search result. */
function extractStatus(text: string, field: string): string | null {
  const lines = text.split(/[\r\n]+/).filter((l) => l.trim());
  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    const idx = cols.findIndex((c) => c.toLowerCase() === field.toLowerCase());
    if (idx >= 0 && i + 1 < lines.length) {
      const data = lines[i + 1].split('\t');
      const value = data[idx];
      return value ? value.trim() : null;
    }
  }
  return null;
}

function makeRetsProvider(cfg: ProviderConfig): ListingProvider {
  return {
    id: cfg.id,
    name: cfg.name,
    type: cfg.type,
    async fetchStatus(mlsNumber) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        // 1) Login — establishes a session cookie + returns capability URLs.
        const loginRes = await fetch(cfg.apiUrl, {
          headers: retsHeaders(cfg),
          signal: controller.signal,
        });
        if (!loginRes.ok) return null;
        const loginXml = await loginRes.text();
        const cookie =
          loginRes.headers.get('set-cookie')?.split(';')[0] || '';

        // 2) Resolve the Search capability (or use the configured path).
        const capability = extractCapability(loginXml, 'Search');
        const base = new URL(cfg.apiUrl).origin;
        const searchUrl = capability
          ? new URL(capability, base).toString()
          : `${base}${cfg.lookupPath.replace('{mls}', '')}`;

        // 3) DMQL search for this listing.
        const params = new URLSearchParams({
          SearchType: cfg.searchResource || 'Property',
          Class: cfg.searchClass || 'RES',
          QueryType: 'DMQL2',
          Query: `(${cfg.queryField || 'MLNumber'}=${mlsNumber})`,
          Format: 'COMPACT-DECODED',
          StandardNames: '1',
          Limit: '1',
        });
        const searchRes = await fetch(`${searchUrl}?${params.toString()}`, {
          headers: retsHeaders(cfg, cookie),
          signal: controller.signal,
        });
        if (!searchRes.ok) return null;
        const text = await searchRes.text();
        return extractStatus(text, cfg.statusField || 'Status');
      } catch {
        return null;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

/** Return every provider that is fully configured in the environment. */
export function getListingProviders(): Record<string, ListingProvider> {
  const providers: Record<string, ListingProvider> = {};
  for (const id of readProviderIds()) {
    const cfg = readConfig(id);
    if (!cfg) continue;
    providers[id] = cfg.type === 'rets' ? makeRetsProvider(cfg) : makeHttpProvider(cfg);
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
