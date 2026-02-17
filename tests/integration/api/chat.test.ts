import { describe, it, expect } from 'vitest';
import { OpenRouterProvider } from '@/lib/llm/openrouter';

describe('Chat API Integration', () => {
  it('should stream a chat response via OpenRouter provider', async () => {
    const provider = new OpenRouterProvider('sk-or-test');
    const chunks: string[] = [];
    let finalUsage = null;

    for await (const chunk of provider.chat({
      model: 'anthropic/claude-opus-4-6',
      messages: [{ role: 'user', content: 'Say hello' }],
      stream: true,
    })) {
      chunks.push(chunk.content);
      if (chunk.usage) finalUsage = chunk.usage;
    }

    const fullContent = chunks.join('');
    expect(fullContent.length).toBeGreaterThan(0);
    expect(finalUsage).not.toBeNull();
  });

  it('should handle non-streaming chat', async () => {
    const provider = new OpenRouterProvider('sk-or-test');
    let response = '';

    for await (const chunk of provider.chat({
      model: 'anthropic/claude-opus-4-6',
      messages: [{ role: 'user', content: 'Say hello' }],
      stream: false,
    })) {
      response += chunk.content;
      expect(chunk.done).toBe(true);
    }

    expect(response).toBe('Hello world!');
  });

  it('should handle multi-turn conversations', async () => {
    const provider = new OpenRouterProvider('sk-or-test');
    let response = '';

    for await (const chunk of provider.chat({
      model: 'anthropic/claude-opus-4-6',
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ],
      stream: true,
    })) {
      response += chunk.content;
    }

    expect(response.length).toBeGreaterThan(0);
  });
});
