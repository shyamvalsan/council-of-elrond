import type { LLMProvider } from './provider';
import type { UserAPIKeys, ModelInfo } from '@/types/models';
import { OpenRouterProvider } from './openrouter';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { GoogleAIProvider } from './google';

/**
 * Resolve which provider to use for a given model ID.
 * Priority: user's direct key → OpenRouter fallback.
 */
export function resolveProvider(
  modelId: string,
  userKeys?: UserAPIKeys
): LLMProvider {
  // Check for direct provider keys (BYOK)
  if (modelId.startsWith('anthropic/') && userKeys?.anthropic) {
    return new AnthropicProvider(userKeys.anthropic);
  }
  if (modelId.startsWith('openai/') && userKeys?.openai) {
    return new OpenAIProvider(userKeys.openai);
  }
  if (modelId.startsWith('google/') && userKeys?.google) {
    return new GoogleAIProvider(userKeys.google);
  }

  // Default: route through OpenRouter
  const key = userKeys?.openrouter ?? process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('No API key available. Please add your OpenRouter API key.');
  return new OpenRouterProvider(key);
}

/**
 * Get the display name for a model ID.
 */
export function getModelDisplayName(modelId: string): string {
  const knownModels: Record<string, string> = {
    'anthropic/claude-opus-4-6': 'Claude Opus 4.6',
    'openai/gpt-5-2': 'GPT-5.2',
    'google/gemini-3-pro-preview': 'Gemini 3 Pro',
    'anthropic/claude-sonnet-4-6': 'Claude Sonnet 4.6',
    'openai/gpt-4o': 'GPT-4o',
    'meta-llama/llama-3.1-405b-instruct': 'Llama 3.1 405B',
  };

  return knownModels[modelId] || modelId.split('/').pop() || modelId;
}

/**
 * Extract provider prefix from model ID.
 */
export function getProviderFromModelId(modelId: string): string {
  return modelId.split('/')[0] || 'unknown';
}

let cachedModels: ModelInfo[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get models list with caching.
 */
export async function getModels(apiKey?: string): Promise<ModelInfo[]> {
  const now = Date.now();
  if (cachedModels && now - cacheTimestamp < CACHE_TTL) {
    return cachedModels;
  }

  const key = apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('No API key available');

  const provider = new OpenRouterProvider(key);
  cachedModels = await provider.listModels();
  cacheTimestamp = now;
  return cachedModels;
}

/**
 * Find a specific model's info.
 */
export async function getModelInfo(
  modelId: string,
  apiKey?: string
): Promise<ModelInfo | undefined> {
  const models = await getModels(apiKey);
  return models.find((m) => m.id === modelId);
}
