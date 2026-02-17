import type { LLMProvider } from './provider';
import type { ChatParams, StreamChunk, Message } from '@/types/chat';
import type { ModelInfo } from '@/types/models';

/**
 * Direct Google AI (Gemini) provider.
 * Used when the user provides their own Google AI API key (BYOK).
 */
export class GoogleAIProvider implements LLMProvider {
  id = 'google';
  name = 'Google AI';
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string) {
    if (!apiKey) throw new Error('Google AI API key is required');
    this.apiKey = apiKey;
  }

  private convertMessages(messages: Message[]): {
    systemInstruction?: { parts: { text: string }[] };
    contents: Array<{ role: string; parts: { text: string }[] }>;
  } {
    const systemMessages = messages.filter((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    return {
      systemInstruction: systemMessages.length
        ? { parts: [{ text: systemMessages.map((m) => m.content).join('\n') }] }
        : undefined,
      contents: nonSystemMessages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    };
  }

  async *chat(params: ChatParams): AsyncGenerator<StreamChunk> {
    const model = params.model.replace('google/', '');
    const { systemInstruction, contents } = this.convertMessages(params.messages);

    const endpoint = params.stream
      ? `${this.baseUrl}/models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`
      : `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction,
        generationConfig: {
          temperature: params.temperature ?? 0.7,
          maxOutputTokens: params.max_tokens || 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Google AI API error (${response.status}): ${errorBody}`);
    }

    if (!params.stream) {
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const usage = data.usageMetadata;
      yield {
        content,
        done: true,
        usage: usage
          ? {
              prompt_tokens: usage.promptTokenCount || 0,
              completion_tokens: usage.candidatesTokenCount || 0,
              total_tokens: usage.totalTokenCount || 0,
            }
          : undefined,
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
        try {
          const parsed = JSON.parse(data);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const finishReason = parsed.candidates?.[0]?.finishReason;
          const usage = parsed.usageMetadata;

          yield {
            content: text,
            done: finishReason === 'STOP',
            usage: usage
              ? {
                  prompt_tokens: usage.promptTokenCount || 0,
                  completion_tokens: usage.candidatesTokenCount || 0,
                  total_tokens: usage.totalTokenCount || 0,
                }
              : undefined,
          };
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: 'google/gemini-3-pro-preview',
        name: 'Gemini 3 Pro',
        description: 'Google Gemini 3 Pro Preview',
        contextLength: 1000000,
        maxCompletionTokens: 8192,
        pricing: { promptPerToken: 0.000007, completionPerToken: 0.000021 },
        provider: 'google',
      },
    ];
  }
}
