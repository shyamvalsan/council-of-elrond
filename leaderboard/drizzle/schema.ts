import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * All judgments received from any Council of Elrond instance.
 * Prompts are stored as SHA-256 hashes for privacy.
 */
export const publicJudgments = pgTable('public_judgments', {
  id: uuid('id').defaultRandom().primaryKey(),
  promptHash: text('prompt_hash').notNull(),
  promptCategory: text('prompt_category'),
  modelAId: text('model_a_id').notNull(),
  modelBId: text('model_b_id').notNull(),
  councilMembers: text('council_members').notNull(), // JSON array of 3-12 model IDs
  winner: text('winner').notNull(), // 'model_a' | 'model_b' | 'council' | 'tie'
  sourceInstance: text('source_instance'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Computed leaderboard entries, refreshed periodically.
 * Each entry represents either an individual model or a council composition.
 */
export const leaderboardEntries = pgTable('leaderboard_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityId: text('entity_id').notNull().unique(),
  entityType: text('entity_type').notNull(), // 'model' | 'council'
  displayName: text('display_name').notNull(),
  characterId: text('character_id'),
  wins: integer('wins').default(0).notNull(),
  losses: integer('losses').default(0).notNull(),
  ties: integer('ties').default(0).notNull(),
  eloRating: real('elo_rating').default(1000.0).notNull(),
  winRate: real('win_rate').default(0.0).notNull(),
  collaborationIndex: real('collaboration_index'),
  totalJudgments: integer('total_judgments').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * LOTR character assignments for models.
 * Dynamic — recomputed as judgment data grows.
 */
export const characterAssignments = pgTable('character_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  modelId: text('model_id').notNull().unique(),
  characterId: text('character_id').notNull(),
  characterName: text('character_name').notNull(),
  rationale: text('rationale'),
  photoUrl: text('photo_url'),
  flavorText: text('flavor_text'),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
});

// Type exports for use in application code
export type PublicJudgment = typeof publicJudgments.$inferSelect;
export type NewPublicJudgment = typeof publicJudgments.$inferInsert;
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type NewLeaderboardEntry = typeof leaderboardEntries.$inferInsert;
export type CharacterAssignment = typeof characterAssignments.$inferSelect;
export type NewCharacterAssignment = typeof characterAssignments.$inferInsert;
