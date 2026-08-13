import { describe, it, expect } from 'vitest';
import { createProviderClient, SYSTEM_PROMPTS } from './providers';

describe('createProviderClient', () => {
  it('should create an OpenAI client', () => {
    const client = createProviderClient('OpenAI', 'gpt-4o', 'test-key');
    expect(client).toBeDefined();
    expect(typeof client.complete).toBe('function');
  });

  it('should create an Anthropic client', () => {
    const client = createProviderClient('Anthropic', 'claude-3-5-sonnet', 'test-key');
    expect(client).toBeDefined();
    expect(typeof client.complete).toBe('function');
  });

  it('should create a Gemini client', () => {
    const client = createProviderClient('Google Gemini', 'gemini-2.0-flash', 'test-key');
    expect(client).toBeDefined();
    expect(typeof client.complete).toBe('function');
  });

  it('should create a DeepSeek client', () => {
    const client = createProviderClient('DeepSeek', 'deepseek-v3', 'test-key');
    expect(client).toBeDefined();
    expect(typeof client.complete).toBe('function');
  });

  it('should create a Qwen client', () => {
    const client = createProviderClient('Qwen', 'qwen-turbo', 'test-key');
    expect(client).toBeDefined();
    expect(typeof client.complete).toBe('function');
  });

  it('should be case-insensitive for provider names', () => {
    const client = createProviderClient('openai', 'gpt-4o', 'test-key');
    expect(client).toBeDefined();
  });

  it('should throw for unsupported providers', () => {
    expect(() => createProviderClient('UnknownProvider', 'model', 'key')).toThrow(
      'Unsupported provider'
    );
  });

  it('should have system prompts defined', () => {
    expect(SYSTEM_PROMPTS.default).toBeTruthy();
    expect(SYSTEM_PROMPTS.crm).toBeTruthy();
    expect(SYSTEM_PROMPTS.crm).toContain('real estate');
  });
});
