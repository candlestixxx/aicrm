/**
 * HyperNexus Tool Catalog Client
 *
 * Proxies HyperNexus's MCP tool catalog (26,000+ tools when the full
 * TypeScript backend is running; Go-local inventory fallback otherwise).
 */

const HYPERNEXUS_URL = process.env.HYPERNEXUS_URL || 'http://127.0.0.1:7778';

async function kernelFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${HYPERNEXUS_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const data = (await res.json().catch(() => ({}))) as T;
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: {
        error: err instanceof Error ? err.message : 'HyperNexus unreachable',
      } as T,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export interface ToolSearchResult {
  name?: string;
  description?: string;
  server?: string;
  alwaysShow?: boolean;
  [key: string]: unknown;
}

export async function searchTools(query: string, limit = 20) {
  return kernelFetch<{
    data?: ToolSearchResult[];
    results?: ToolSearchResult[];
  }>(`/api/mcp/tools/search?query=${encodeURIComponent(query)}&limit=${limit}`);
}

export async function callTool(toolName: string, args: Record<string, unknown> = {}) {
  return kernelFetch<{ data?: unknown; result?: unknown }>('/api/mcp/tools/call', {
    method: 'POST',
    body: JSON.stringify({ name: toolName, arguments: args }),
  });
}

export async function listCatalog() {
  return kernelFetch<{ data?: unknown[]; servers?: unknown[] }>('/api/catalog');
}
