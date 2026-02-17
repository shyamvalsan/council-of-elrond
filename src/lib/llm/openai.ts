import type { LLMProvider } from './provider';
import type { ChatParams, StreamChunk } from '@/types/chat';
import type { ModelInfo } from '@/types/models';

/**
 * Direct OpenAI API provider.
 * Used when the user provides their own OpenAI API key (BYOK).
 */
export class OpenAIProvider implements LLMProvider {
  id = 'openai';
  name = 'OpenAI';
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    if (!apiKey) throw new Error('OpenAI API key is required');
    this.apiKey = apiKey;
  }

  async *chat(params: ChatParams): AsyncGenerator<StreamChunk> {
    const model = params.model.replace('openai/', '');

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.max_tokens,
        stream: params.stream,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
    }

    if (!params.stream) {
      const data = await response.json();
      yield {
        content: data.choices?.[0]?.message?.content || '',
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
        if (!trimmed.startsWith('data: ')) continue;

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
          // Skip malformed chunks
        }
      }
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!response.ok) throw new Error('Failed to fetch OpenAI models');
    const data = await response.json();

    return (data.data || [])
      .filter((m: { id: string }) => m.id.startsWith('gpt-'))
      .map((m: { id: string }) => ({
        id: `openai/${m.id}`,
        name: m.id,
        description: '',
        contextLength: 128000,
        maxCompletionTokens: 4096,
        pricing: { promptPerToken: 0.00001, completionPerToken: 0.00003 },
        provider: 'openai',
      }));
  }
}
