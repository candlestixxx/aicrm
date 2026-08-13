/**
 * HyperNexus Swarm Orchestration Client
 *
 * Proxies HyperNexus's multi-agent swarm / debate / consensus endpoints.
 */

const HYPERNEXUS_URL = process.env.HYPERNEXUS_URL || 'http://127.0.0.1:7778';

async function kernelFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
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

export async function swarmStart() {
  return kernelFetch<{ data?: { missionId?: string; status?: string } }>(
    '/api/swarm/start',
    { method: 'POST', body: JSON.stringify({}) }
  );
}

export async function swarmDebate(prompt: string) {
  return kernelFetch<{ data?: unknown }>('/api/swarm/debate', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
}

export async function swarmConsensus(prompt: string, models: string[] = []) {
  return kernelFetch<{ data?: unknown }>('/api/swarm/consensus', {
    method: 'POST',
    body: JSON.stringify({ prompt, models }),
  });
}

export async function swarmMissions() {
  return kernelFetch<{ data?: unknown[] }>('/api/swarm/missions');
}
