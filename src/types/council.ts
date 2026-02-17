export interface CouncilConfig {
  members: string[];
  maxRounds: number;
  convergenceThreshold: number;
  userPrompt: string;
  attachments?: import('./chat').Attachment[];
  synthesizerStrategy: 'round-robin' | 'voted' | 'fixed';
}

export interface CouncilRound {
  round: number;
  critiques: MemberResponse[];
  synthesis: string;
  synthesizerId: string;
  approvals: Record<string, boolean>;
}

export interface MemberResponse {
  modelId: string;
  content: string;
  tokens: number;
  cost: number;
  latencyMs: number;
}

export interface CouncilResult {
  finalResponse: string;
  transcript: CouncilRound[];
  totalTokens: number;
  totalCost: number;
  totalLatencyMs: number;
  roundsUsed: number;
  approvals: Record<string, boolean>;
  memberStats: Record<string, { tokens: number; cost: number }>;
}

export type CouncilStreamEvent =
  | { type: 'phase'; phase: string; round?: number }
  | { type: 'member_response'; modelId: string; content: string; phase: string }
  | { type: 'synthesis'; content: string; round: number }
  | { type: 'converged'; response: string; round: number }
  | { type: 'max_rounds'; response: string }
  | { type: 'stats'; tokens: number; cost: number; latencyMs: number }
  | { type: 'error'; message: string };

export interface CouncilRequestBody {
  members: string[];
  maxRounds: number;
  convergenceThreshold?: number;
  synthesizerStrategy?: 'round-robin' | 'voted' | 'fixed';
  messages: import('./chat').Message[];
  userApiKey?: string;
}
