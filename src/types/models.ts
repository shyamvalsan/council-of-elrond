export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  maxCompletionTokens: number;
  pricing: {
    promptPerToken: number;
    completionPerToken: number;
  };
  provider: string;
}

export interface UserAPIKeys {
  openrouter?: string;
  anthropic?: string;
  openai?: string;
  google?: string;
}

export const DEFAULT_MODEL_A = 'anthropic/claude-opus-4-6';
export const DEFAULT_MODEL_B = 'openai/gpt-5.2';
export const DEFAULT_COUNCIL_MEMBERS = [
  'anthropic/claude-opus-4-6',
  'openai/gpt-5.2',
  'google/gemini-3-pro-preview',
];
