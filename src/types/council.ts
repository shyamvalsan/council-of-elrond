export interface CouncilConfig {
  members: string[];
  contextBudget: number;
  userPrompt: string;
  attachments?: import('./chat').Attachment[];
}

export interface CompletedMessage {
  modelId: string;
  content: string;
  tokens: number;
  cost: number;
}

export interface CouncilResult {
  finalResponse: string;
  messages: CompletedMessage[];
  totalTokens: number;
  totalCost: number;
  totalLatencyMs: number;
  memberStats: Record<string, { tokens: number; cost: number }>;
}

export type CouncilStreamEvent =
  | { type: 'turn_start'; modelId: string; turnIndex: number }
  | { type: 'turn_delta'; modelId: string; turnIndex: number; content: string }
  | { type: 'turn_end'; modelId: string; turnIndex: number; tokens: number; cost: number }
  | { type: 'final_answer'; response: string }
  | { type: 'budget'; used: number; total: number }
  | { type: 'stats'; tokens: number; cost: number; latencyMs: number }
  | { type: 'error'; message: string };

export interface CouncilRequestBody {
  members: string[];
  contextBudget?: number;
  messages: import('./chat').Message[];
  userApiKey?: string;
}
