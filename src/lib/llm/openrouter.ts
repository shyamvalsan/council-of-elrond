import type { LLMProvider } from './provider';
import type { ChatParams, StreamChunk } from '@/types/chat';
import type { ModelInfo } from '@/types/models';

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing: { prompt: string; completion: string };
  context_length: number;
  top_provider?: { max_completion_tokens?: number };
}

function mapOpenRouterModel(m: OpenRouterModel): ModelInfo {
  return {
    id: m.id,
    name: m.name,
    description: m.description || '',
    contextLength: m.context_length,
    maxCompletionTokens: m.top_provider?.max_completion_tokens || 4096,
    pricing: {
      promptPerToken: parseFloat(m.pricing.prompt) || 0,
      completionPerToken: parseFloat(m.pricing.completion) || 0,
    },
    provider: 'openrouter',
  };
}

export class OpenRouterProvider implements LLMProvider {
  id = 'openrouter';
  name = 'OpenRouter';
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    if (!apiKey) throw new Error('OpenRouter API key is required');
    this.apiKey = apiKey;
  }

  async *chat(params: ChatParams): AsyncGenerator<StreamChunk> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://council-of-elrond.dev',
        'X-Title': 'Council of Elrond',
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.max_tokens,
        stream: params.stream,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
    }

    if (!params.stream) {
      const data = await response.json();
      const choice = data.choices?.[0];
      yield {
        content: choice?.message?.content || '',
        done: true,
        usage: data.usage,
      };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const choice = parsed.choices?.[0];
          if (!choice) continue;

          yield {
            content: choice.delta?.content || '',
            done: choice.finish_reason === 'stop',
            usage: parsed.usage,
          };
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    return (data.data || []).map(mapOpenRouterModel);
  }
}
