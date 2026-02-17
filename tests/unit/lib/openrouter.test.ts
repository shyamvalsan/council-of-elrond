import { describe, it, expect } from 'vitest';
import { OpenRouterProvider } from '@/lib/llm/openrouter';

describe('OpenRouterProvider', () => {
  it('should throw if no API key is provided', () => {
    expect(() => new OpenRouterProvider('')).toThrow('OpenRouter API key is required');
  });

  it('should have correct id and name', () => {
    const provider = new OpenRouterProvider('sk-or-test');
    expect(provider.id).toBe('openrouter');
    expect(provider.name).toBe('OpenRouter');
  });

  it('should list models from OpenRouter API', async () => {
    const provider = new OpenRouterProvider('sk-or-test');
    const models = await provider.listModels();

    expect(models).toBeInstanceOf(Array);
    expect(models.length).toBeGreaterThan(0);
    expect(models[0]).toHaveProperty('id');
    expect(models[0]).toHaveProperty('name');
    expect(models[0]).toHaveProperty('pricing');
    expect(models[0]).toHaveProperty('contextLength');
  });

  it('should stream chat responses', async () => {
    const provider = new OpenRouterProvider('sk-or-test');
    const chunks: string[] = [];

    for await (const chunk of provider.chat({
      model: 'anthropic/claude-opus-4-6',
      messages: [{ role: 'user', content: 'Hello' }],
      stream: true,
    })) {
      chunks.push(chunk.content);
    }

    const fullContent = chunks.join('');
    expect(fullContent).toBe('Hello world!');
  });

  it('should handle non-streaming responses', async () => {
    const provider = new OpenRouterProvider('sk-or-test');
    const chunks: string[] = [];

    for await (const chunk of provider.chat({
      model: 'anthropic/claude-opus-4-6',
      messages: [{ role: 'user', content: 'Hello' }],
      stream: false,
    })) {
      chunks.push(chunk.content);
      expect(chunk.done).toBe(true);
    }

    expect(chunks.join('')).toBe('Hello world!');
  });

  it('should return usage information', async () => {
    const provider = new OpenRouterProvider('sk-or-test');
    let finalUsage = null;

    for await (const chunk of provider.chat({
      model: 'anthropic/claude-opus-4-6',
      messages: [{ role: 'user', content: 'Hello' }],
      stream: true,
    })) {
      if (chunk.usage) finalUsage = chunk.usage;
    }

    expect(finalUsage).not.toBeNull();
    expect(finalUsage?.prompt_tokens).toBe(10);
    expect(finalUsage?.completion_tokens).toBe(3);
    expect(finalUsage?.total_tokens).toBe(13);
  });
});
