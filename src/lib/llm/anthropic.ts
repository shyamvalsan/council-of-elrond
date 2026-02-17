import type { LLMProvider } from './provider';
import type { ChatParams, StreamChunk, Message } from '@/types/chat';
import type { ModelInfo } from '@/types/models';

/**
 * Direct Anthropic API provider.
 * Used when the user provides their own Anthropic API key (BYOK).
 */
export class AnthropicProvider implements LLMProvider {
  id = 'anthropic';
  name = 'Anthropic';
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1';

  constructor(apiKey: string) {
    if (!apiKey) throw new Error('Anthropic API key is required');
    this.apiKey = apiKey;
  }

  private convertMessages(messages: Message[]): {
    system?: string;
    messages: Array<{ role: string; content: string }>;
  } {
    const systemMessages = messages.filter((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');
    return {
      system: systemMessages.map((m) => m.content).join('\n') || undefined,
      messages: nonSystemMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    };
  }

  async *chat(params: ChatParams): AsyncGenerator<StreamChunk> {
    const { system, messages } = this.convertMessages(params.messages);
    const model = params.model.replace('anthropic/', '');

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        messages,
        system,
        max_tokens: params.max_tokens || 4096,
        temperature: params.temperature ?? 0.7,
        stream: params.stream,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errorBody}`);
    }

    if (!params.stream) {
      const data = await response.json();
      const content = data.content?.[0]?.text || '';
      yield {
        content,
        done: true,
        usage: {
          prompt_tokens: data.usage?.input_tokens || 0,
          completion_tokens: data.usage?.output_tokens || 0,
          total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
      };
      return;
    }

    // Handle streaming
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
          if (parsed.type === 'content_block_delta') {
            yield {
              content: parsed.delta?.text || '',
              done: false,
            };
          } else if (parsed.type === 'message_stop') {
            yield { content: '', done: true };
          } else if (parsed.type === 'message_delta' && parsed.usage) {
            yield {
              content: '',
              done: true,
              usage: {
                prompt_tokens: parsed.usage.input_tokens || 0,
                completion_tokens: parsed.usage.output_tokens || 0,
                total_tokens:
                  (parsed.usage.input_tokens || 0) +
                  (parsed.usage.output_tokens || 0),
              },
            };
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    // Anthropic doesn't have a public model listing API,
    // return known models
    return [
      {
        id: 'anthropic/claude-opus-4-6',
        name: 'Claude Opus 4.6',
        description: 'Most capable Claude model',
        contextLength: 200000,
        maxCompletionTokens: 4096,
        pricing: { promptPerToken: 0.000015, completionPerToken: 0.000075 },
        provider: 'anthropic',
      },
      {
        id: 'anthropic/claude-sonnet-4-6',
        name: 'Claude Sonnet 4.6',
        description: 'Balanced Claude model',
        contextLength: 200000,
        maxCompletionTokens: 4096,
        pricing: { promptPerToken: 0.000003, completionPerToken: 0.000015 },
        provider: 'anthropic',
      },
    ];
  }
}
