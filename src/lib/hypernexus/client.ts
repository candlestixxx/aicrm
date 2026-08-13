/**
 * HyperNexus Client
 *
 * Connects AiCRM to a running HyperNexus "TN Kernel" control plane
 * (https://github.com/HyperNexusllc/HyperNexus), enabling shared persistent
 * memory, agent chat routing, and status across both systems.
 *
 * Kernel defaults to http://127.0.0.1:7778.
 * Override with HYPERNEXUS_URL in .env.
 */

const HYPERNEXUS_URL = process.env.HYPERNEXUS_URL || 'http://127.0.0.1:7778';

export interface KernelHealth {
  ok: boolean;
  service?: string;
  version?: string;
  uptimeSec?: number;
  baseUrl?: string;
}

export interface MemoryEntry {
  id?: string;
  namespace?: string;
  type?: string;
  content: string;
  tags?: string[];
  createdAt?: string;
}

interface KernelResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  [key: string]: unknown;
}

async function kernelFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: KernelResponse<T> }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${HYPERNEXUS_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const data = (await res.json().catch(() => ({}))) as KernelResponse<T>;
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: {
        error: err instanceof Error ? err.message : 'HyperNexus unreachable',
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function hypernexusHealth(): Promise<KernelHealth | null> {
  const res = await kernelFetch<KernelHealth>('/health');
  if (!res.ok) return null;
  // The kernel's /health endpoint returns { ok, service, version, ... } directly
  return res.data as unknown as KernelHealth;
}

export async function hypernexusMemoryAdd(entry: MemoryEntry) {
  const res = await kernelFetch<MemoryEntry>('/api/agent-memory/add', {
    method: 'POST',
    body: JSON.stringify({
      namespace: entry.namespace || 'aicrm',
      type: entry.type || 'working',
      content: entry.content,
      tags: entry.tags || [],
    }),
  });
  return res;
}

export async function hypernexusMemorySearch(query: string, limit = 10) {
  const res = await kernelFetch<{ results?: unknown[] }>(
    `/api/agent-memory/search?query=${encodeURIComponent(query)}&limit=${limit}`
  );
  return res;
}

export async function hypernexusChat(prompt: string) {
  const res = await kernelFetch<{ response?: string; reply?: string }>(
    '/api/agent/chat',
    {
      method: 'POST',
      body: JSON.stringify({ message: prompt }),
    }
  );
  return res;
}

export { HYPERNEXUS_URL };
