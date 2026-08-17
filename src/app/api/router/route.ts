import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { decrypt } from '@/lib/encryption';
import { createProviderClient, SYSTEM_PROMPTS, CompletionResponse } from '@/lib/llm/providers';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// Tier 1: Fast/Cheap models for basic tasks
const TIER_1_MODELS = [
  { provider: 'Google Gemini', model: 'gemini-3.6-flash', costPer1k: 0.0001 },
  { provider: 'Qwen', model: 'qwen-turbo', costPer1k: 0.00015 },
  { provider: 'Xiaomi', model: 'mixtral-8x7b', costPer1k: 0.0002 },
];

// Tier 2: Frontier models for complex reasoning
const TIER_2_MODELS = [
  { provider: 'OpenAI', model: 'gpt-4o', costPer1k: 0.005 },
  { provider: 'Anthropic', model: 'claude-3-5-sonnet', costPer1k: 0.003 },
  { provider: 'DeepSeek', model: 'deepseek-chat', costPer1k: 0.001 },
];

// Local orchestrators (not called via HTTP — handled separately)
const LOCAL_MODELS = [
  { provider: 'Hermes Agent', model: 'hermes-local' },
  { provider: 'OpenClaw', model: 'openclaw-local' },
];

// Keywords that indicate complex reasoning is required
const COMPLEX_TASK_KEYWORDS = [
  'negotiate', 'draft', 'strategy', 'analyze', 'advise',
  'reasoning', 'complex', 'contract', 'proposal', 'legal',
  'compliance', 'valuation', 'market analysis',
];

interface RouterRequest {
  task: string;
  context?: unknown;
  preferredModel?: string;
  /** If false, only return the routing decision without calling the LLM */
  execute?: boolean;
  systemPrompt?: string;
}

function evaluateTaskComplexity(task: string): number {
  const lowerTask = task.toLowerCase();
  const isComplex = COMPLEX_TASK_KEYWORDS.some((keyword) =>
    lowerTask.includes(keyword)
  );
  return isComplex ? 2 : 1;
}

interface ResolvedProvider {
  provider: string;
  model: string;
  costPer1k?: number;
  key: string;
}

async function getAvailableProvider(
  providers: { provider: string; model: string; costPer1k?: number }[]
): Promise<ResolvedProvider | null> {
  const configuredKeys = await prisma.apiKey.findMany({
    select: { provider: true, key: true },
  });

  const configuredProviders = new Set(configuredKeys.map((k) => k.provider));

  for (const p of providers) {
    if (configuredProviders.has(p.provider)) {
      const keyRecord = configuredKeys.find((k) => k.provider === p.provider);
      if (keyRecord) {
        try {
          const decryptedKey = decrypt(keyRecord.key);
          return { ...p, key: decryptedKey };
        } catch {
          continue;
        }
      }
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  // Rate limit: 60 requests per minute per IP
  const rl = rateLimit({
    limit: 60,
    windowMs: 60 * 1000,
    identifier: `router:${getClientIp(request)}`,
  });

  if (!rl.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSeconds) },
      }
    );
  }

  try {
    const body: RouterRequest = await request.json();

    if (!body.task) {
      return NextResponse.json(
        { error: 'Task description is required' },
        { status: 400 }
      );
    }

    const requiredTier = evaluateTaskComplexity(body.task);
    const shouldExecute = body.execute !== false;

    // Resolve the model to use
    let resolved: ResolvedProvider | null = null;
    let routingReasoning = '';
    let usedFallback = false;

    if (body.preferredModel) {
      const allModels = [...TIER_1_MODELS, ...TIER_2_MODELS, ...LOCAL_MODELS];
      const matching = allModels.find(
        (m) => m.provider.toLowerCase() === body.preferredModel?.toLowerCase()
      );

      if (!matching) {
        return NextResponse.json(
          { error: `Unknown model "${body.preferredModel}"` },
          { status: 400 }
        );
      }

      if (LOCAL_MODELS.includes(matching)) {
        return NextResponse.json(
          {
            error: `Local orchestrator "${matching.provider}" must be called directly, not via the router.`,
          },
          { status: 400 }
        );
      }

      resolved = await getAvailableProvider([matching]);
      if (!resolved) {
        return NextResponse.json(
          {
            error: `Preferred model "${body.preferredModel}" is not configured. Add its API key in Model Manager.`,
          },
          { status: 400 }
        );
      }
      routingReasoning = `User explicitly requested ${body.preferredModel}`;
    } else if (requiredTier === 1) {
      resolved = await getAvailableProvider(TIER_1_MODELS);
      if (resolved) {
        routingReasoning =
          'Task assessed as simple data processing. Routing to Tier 1 for cost efficiency.';
      } else {
        resolved = await getAvailableProvider(TIER_2_MODELS);
        if (resolved) {
          routingReasoning = 'No Tier 1 models configured. Falling back to Tier 2.';
          usedFallback = true;
        }
      }
    } else {
      resolved = await getAvailableProvider(TIER_2_MODELS);
      if (resolved) {
        routingReasoning =
          'Task assessed as complex reasoning. Escalating to Tier 2 frontier model.';
      } else {
        resolved = await getAvailableProvider(TIER_1_MODELS);
        if (resolved) {
          routingReasoning =
            'No Tier 2 models configured. Falling back to Tier 1 — results may be less sophisticated.';
          usedFallback = true;
        }
      }
    }

    if (!resolved) {
      return NextResponse.json(
        {
          error:
            'No AI models configured. Please add at least one API key in the Model Manager.',
          task: body.task,
          assignedTier: requiredTier,
          status: 'no_models_available',
        },
        { status: 503 }
      );
    }

    const baseResult = {
      task: body.task,
      assignedTier: requiredTier,
      selectedModel: resolved.model,
      provider: resolved.provider,
      estimatedCost: resolved.costPer1k
        ? `$${resolved.costPer1k.toFixed(4)}/1K tokens`
        : 'N/A',
      routingReasoning,
      fallbackAvailable: !usedFallback,
    };

    if (!shouldExecute) {
      return NextResponse.json({
        ...baseResult,
        status: 'routed_successfully',
        executed: false,
      });
    }

    // Execute the actual LLM call
    try {
      const client = createProviderClient(
        resolved.provider,
        resolved.model,
        resolved.key
      );

      const completion: CompletionResponse = await client.complete({
        system: body.systemPrompt ?? SYSTEM_PROMPTS.crm,
        prompt: body.task,
      });

      return NextResponse.json({
        ...baseResult,
        status: usedFallback ? 'executed_with_fallback' : 'executed_successfully',
        executed: true,
        response: completion.text,
        usage: completion.usage,
        latencyMs: completion.latencyMs,
      });
    } catch (llmError) {
      console.error('LLM execution error:', llmError);
      return NextResponse.json(
        {
          ...baseResult,
          status: 'execution_failed',
          executed: true,
          error:
            llmError instanceof Error
              ? llmError.message
              : 'Failed to execute model call',
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Error in HyperNexus Router:', error);
    return NextResponse.json(
      { error: 'Failed to process routing request' },
      { status: 500 }
    );
  }
}
