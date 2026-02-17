import { describe, it, expect } from 'vitest';
import { resolveProvider, getModelDisplayName, getProviderFromModelId } from '@/lib/llm/models';

describe('resolveProvider', () => {
  it('should return OpenRouter provider when no direct keys provided', () => {
    const provider = resolveProvider('anthropic/claude-opus-4-6', {
      openrouter: 'sk-or-test',
    });
    expect(provider.id).toBe('openrouter');
  });

  it('should return Anthropic provider when anthropic key provided for anthropic model', () => {
    const provider = resolveProvider('anthropic/claude-opus-4-6', {
      anthropic: 'sk-ant-test',
    });
    expect(provider.id).toBe('anthropic');
  });

  it('should return OpenAI provider when openai key provided for openai model', () => {
    const provider = resolveProvider('openai/gpt-5-2', {
      openai: 'sk-test',
    });
    expect(provider.id).toBe('openai');
  });

  it('should return Google provider when google key provided for google model', () => {
    const provider = resolveProvider('google/gemini-3-pro-preview', {
      google: 'google-test',
    });
    expect(provider.id).toBe('google');
  });

  it('should fallback to OpenRouter for anthropic model without anthropic key', () => {
    const provider = resolveProvider('anthropic/claude-opus-4-6', {
      openrouter: 'sk-or-test',
    });
    expect(provider.id).toBe('openrouter');
  });

  it('should throw when no keys are available', () => {
    const originalKey = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    expect(() => resolveProvider('anthropic/claude-opus-4-6')).toThrow(
      'No API key available'
    );

    process.env.OPENROUTER_API_KEY = originalKey;
  });
});

describe('getModelDisplayName', () => {
  it('should return known model names', () => {
    expect(getModelDisplayName('anthropic/claude-opus-4-6')).toBe('Claude Opus 4.6');
    expect(getModelDisplayName('openai/gpt-5-2')).toBe('GPT-5.2');
    expect(getModelDisplayName('google/gemini-3-pro-preview')).toBe('Gemini 3 Pro');
  });

  it('should extract name from unknown model IDs', () => {
    expect(getModelDisplayName('unknown/cool-model')).toBe('cool-model');
  });
});

describe('getProviderFromModelId', () => {
  it('should extract provider prefix', () => {
    expect(getProviderFromModelId('anthropic/claude-opus-4-6')).toBe('anthropic');
    expect(getProviderFromModelId('openai/gpt-5-2')).toBe('openai');
    expect(getProviderFromModelId('google/gemini-3-pro-preview')).toBe('google');
  });
});
