/**
 * LLM Provider Clients
 *
 * Each provider implements a `complete()` method that takes a prompt and
 * returns generated text. Keys are passed in (already decrypted by the
 * caller) so this module stays stateless and provider-agnostic.
 */

export interface CompletionRequest {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionResponse {
  text: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  latencyMs: number;
}

export interface ProviderClient {
  complete(req: CompletionRequest): Promise<CompletionResponse>;
}

// ─── OpenAI (and OpenAI-compatible: DeepSeek, Qwen) ────────────
class OpenAICompatibleClient implements ProviderClient {
  constructor(
    private apiKey: string,
    private model: string,
    private baseUrl: string = 'https://api.openai.com/v1',
    private providerName: string = 'OpenAI'
  ) {}

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const start = Date.now();
    const messages: { role: string; content: string }[] = [];
    if (req.system) messages.push({ role: 'system', content: req.system });
    messages.push({ role: 'user', content: req.prompt });

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens ?? 1024,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `${this.providerName} API error (${res.status}): ${body.slice(0, 300)}`
      );
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    return {
      text,
      model: this.model,
      provider: this.providerName,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      },
      latencyMs: Date.now() - start,
    };
  }
}

// ─── Anthropic (Claude) ─────────────────────────────────────────
class AnthropicClient implements ProviderClient {
  constructor(
    private apiKey: string,
    private model: string,
    private providerName: string = 'Anthropic'
  ) {}

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const start = Date.now();

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: req.maxTokens ?? 1024,
        temperature: req.temperature ?? 0.7,
        system: req.system,
        messages: [{ role: 'user', content: req.prompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Anthropic API error (${res.status}): ${body.slice(0, 300)}`
      );
    }

    const data = await res.json();
    const text =
      data.content
        ?.filter((block: { type: string }) => block.type === 'text')
        .map((block: { text: string }) => block.text)
        .join('') ?? '';

    return {
      text,
      model: this.model,
      provider: this.providerName,
      usage: {
        promptTokens: data.usage?.input_tokens,
        completionTokens: data.usage?.output_tokens,
        totalTokens:
          (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
      latencyMs: Date.now() - start,
    };
  }
}

// ─── Google Gemini ──────────────────────────────────────────────
class GeminiClient implements ProviderClient {
  constructor(
    private apiKey: string,
    private model: string,
    private providerName: string = 'Google Gemini'
  ) {}

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const start = Date.now();

    const systemPart = req.system
      ? { systemInstruction: { parts: [{ text: req.system }] } }
      : {};

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...systemPart,
          contents: [{ parts: [{ text: req.prompt }] }],
          generationConfig: {
            temperature: req.temperature ?? 0.7,
            maxOutputTokens: req.maxTokens ?? 1024,
          },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Gemini API error (${res.status}): ${body.slice(0, 300)}`
      );
    }

    const data = await res.json();
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? '')
        .join('') ?? '';

    return {
      text,
      model: this.model,
      provider: this.providerName,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount,
        completionTokens: data.usageMetadata?.candidatesTokenCount,
        totalTokens: data.usageMetadata?.totalTokenCount,
      },
      latencyMs: Date.now() - start,
    };
  }
}

// ─── Factory ────────────────────────────────────────────────────
export function createProviderClient(
  provider: string,
  model: string,
  apiKey: string
): ProviderClient {
  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAICompatibleClient(apiKey, model, 'https://api.openai.com/v1', 'OpenAI');
    case 'anthropic':
      return new AnthropicClient(apiKey, model);
    case 'google gemini':
      return new GeminiClient(apiKey, model);
    case 'deepseek':
      return new OpenAICompatibleClient(apiKey, model, 'https://api.deepseek.com/v1', 'DeepSeek');
    case 'qwen':
      return new OpenAICompatibleClient(apiKey, model, 'https://dashscope.aliyuncs.com/compatible-mode/v1', 'Qwen');
    case 'xiaomi':
      return new OpenAICompatibleClient(apiKey, model, 'https://api.xiaomi.com/v1', 'Xiaomi');
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export const SYSTEM_PROMPTS = {
  default:
    'You are a helpful assistant for a real estate CRM. Be concise and professional.',
  crm:
    'You are an AI assistant embedded in a real estate CRM. You help agents draft emails, analyze leads, summarize conversations, and suggest next steps. Be helpful, concise, and industry-aware.',
} as const;
