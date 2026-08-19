import prisma from '@/lib/db/prisma';
import { decrypt } from '@/lib/encryption';
import { createProviderClient, SYSTEM_PROMPTS } from '@/lib/llm/providers';

/**
 * Pluggable AI Engine — two interchangeable "brains" behind one interface.
 *
 *   Native (v1)       — calls your vault keys (DeepSeek/Gemini/OpenAI) directly.
 *                       Fast, reliable, default. The "built-in HyperNexus" layer.
 *
 *   ControlPlane (v2) — routes through the external HyperNexus control plane
 *                       (swarm / agent chat / memory). Advanced, optional.
 *
 *   Hybrid            — tries Native first, falls back to Control Plane.
 *
 * Selected via:
 *   - env var AI_ENGINE=native|controlplane|hybrid (default native)
 *   - or a per-request `engine` override on /api/assistant and /api/router
 */

export type AIEngineMode = 'native' | 'controlplane' | 'hybrid';

export interface AIEngine {
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  complete(prompt: string, system?: string): Promise<string | null>;
}

// ─── Native Engine (v1) ─────────────────────────────────────────
const NATIVE_MODEL_MAP: Record<string, string> = {
  DeepSeek: 'deepseek-chat',
  'Google Gemini': 'gemini-3.6-flash',
  OpenAI: 'gpt-4o',
  Anthropic: 'claude-3-5-sonnet',
};

export const nativeEngine: AIEngine = {
  name: 'native',
  version: 'v1',
  description: 'Direct calls to your AI provider keys (DeepSeek, Gemini, etc.) via the encrypted vault.',
  capabilities: ['draft', 'analyze', 'negotiate', 'summarize', 'chat'],
  async complete(prompt, system) {
    const keys = await prisma.apiKey.findMany({ select: { provider: true, key: true } });
    const preference = ['DeepSeek', 'Google Gemini', 'OpenAI', 'Anthropic'];
    const ordered = keys.sort(
      (a, b) => preference.indexOf(a.provider) - preference.indexOf(b.provider)
    );
    for (const record of ordered) {
      try {
        const model = NATIVE_MODEL_MAP[record.provider];
        if (!model) continue;
        const client = createProviderClient(record.provider, model, decrypt(record.key));
        return (await client.complete({ system: system || SYSTEM_PROMPTS.crm, prompt })).text;
      } catch {
        continue;
      }
    }
    return null;
  },
};

// ─── Control Plane Engine (v2) ──────────────────────────────────
const HYPERNEXUS_URL = process.env.HYPERNEXUS_URL || 'http://127.0.0.1:7778';

export const controlPlaneEngine: AIEngine = {
  name: 'controlplane',
  version: 'v2',
  description: 'Routes through the external HyperNexus control plane (agent chat + swarm).',
  capabilities: ['draft', 'analyze', 'negotiate', 'chat', 'swarm', 'debate', 'consensus'],
  async complete(prompt, system) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const message = system ? `${system}\n\n${prompt}` : prompt;
      const res = await fetch(`${HYPERNEXUS_URL}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json().catch(() => ({}));
      const content =
        (data as { data?: { content?: string } }).data?.content ||
        (data as { response?: string }).response ||
        null;
      return content;
    } catch {
      return null;
    }
  },
};

// ─── Hybrid Engine ──────────────────────────────────────────────
export const hybridEngine: AIEngine = {
  name: 'hybrid',
  version: 'v1+v2',
  description: 'Tries the Native engine first, then falls back to the Control Plane.',
  capabilities: [
    ...nativeEngine.capabilities,
    ...controlPlaneEngine.capabilities.filter((c) => !nativeEngine.capabilities.includes(c)),
  ],
  async complete(prompt, system) {
    const native = await nativeEngine.complete(prompt, system);
    if (native) return native;
    return controlPlaneEngine.complete(prompt, system);
  },
};

// ─── Factory ────────────────────────────────────────────────────
export function getAIEngine(mode?: string): AIEngine {
  const m = (mode || process.env.AI_ENGINE || 'native').toLowerCase();
  switch (m) {
    case 'controlplane':
      return controlPlaneEngine;
    case 'hybrid':
      return hybridEngine;
    case 'native':
    default:
      return nativeEngine;
  }
}

export function listEngines() {
  return [nativeEngine, controlPlaneEngine, hybridEngine].map((e) => ({
    name: e.name,
    version: e.version,
    description: e.description,
    capabilities: e.capabilities,
  }));
}
