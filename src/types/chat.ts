export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant_a' | 'assistant_b' | 'council';
  modelId: string | null;
  content: string;
  tokenCount: number | null;
  costUsd: number | null;
  latencyMs: number | null;
  fundedBy: 'community' | 'user';
  createdAt: Date;
}

export interface Chat {
  id: string;
  userId: string | null;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}

export interface StreamChunk {
  content: string;
  done: boolean;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatParams {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  stream: boolean;
}

export interface ChatRequestBody {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  userApiKey?: string;
}

export interface Attachment {
  type: 'file' | 'audio';
  name: string;
  content: string;
  mimeType: string;
}
