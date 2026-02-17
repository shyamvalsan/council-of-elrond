// Re-export all schema definitions from the canonical drizzle schema
export {
  publicJudgments,
  leaderboardEntries,
  characterAssignments,
} from '../../../drizzle/schema.js';

export type {
  PublicJudgment,
  NewPublicJudgment,
  LeaderboardEntry,
  NewLeaderboardEntry,
  CharacterAssignment,
  NewCharacterAssignment,
} from '../../../drizzle/schema.js';
