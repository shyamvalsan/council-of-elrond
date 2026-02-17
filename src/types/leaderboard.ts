export interface JudgmentSubmission {
  promptHash: string;
  promptCategory?: string;
  modelAId: string;
  modelBId: string;
  councilMembers: string[];
  winner: 'model_a' | 'model_b' | 'council' | 'tie';
}

export interface LeaderboardEntry {
  entityId: string;
  entityType: 'model' | 'council';
  displayName: string;
  characterId: string | null;
  wins: number;
  losses: number;
  ties: number;
  eloRating: number;
  winRate: number;
  collaborationIndex: number | null;
  totalJudgments: number;
}

export interface CharacterAssignment {
  modelId: string;
  characterId: string;
  characterName: string;
  rationale: string;
  photoUrl: string | null;
  flavorText: string;
}

export type PromptCategory = 'code' | 'creative' | 'reasoning' | 'factual' | 'general';

export interface CommunityStats {
  totalUsers: number;
  totalTokens: number;
  totalJudgments: number;
}
