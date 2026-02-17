import type { ChatParams, StreamChunk } from '@/types/chat';
import type { ModelInfo } from '@/types/models';

/**
 * Abstract LLM provider interface.
 * All providers (OpenRouter, Anthropic, OpenAI, Google) implement this.
 */
export interface LLMProvider {
  id: string;
  name: string;

  /**
   * Stream a chat completion response.
   * Yields chunks as they arrive from the provider.
   */
  chat(params: ChatParams): AsyncGenerator<StreamChunk>;

  /**
   * List available models from this provider.
   */
  listModels(): Promise<ModelInfo[]>;
}
