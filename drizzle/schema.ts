import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  displayName: text('display_name'),
  apiKeyMode: text('api_key_mode').default('community'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const chats = sqliteTable('chats', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id),
  title: text('title'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const messages = sqliteTable('messages', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  chatId: text('chat_id').references(() => chats.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  modelId: text('model_id'),
  content: text('content').notNull(),
  tokenCount: integer('token_count'),
  costUsd: real('cost_usd'),
  latencyMs: integer('latency_ms'),
  fundedBy: text('funded_by').default('community'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const councilSessions = sqliteTable('council_sessions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  chatId: text('chat_id').references(() => chats.id, { onDelete: 'cascade' }),
  messageId: text('message_id').references(() => messages.id),
  memberModels: text('member_models').notNull(),
  numRounds: integer('num_rounds'),
  totalTokens: integer('total_tokens'),
  totalCostUsd: real('total_cost_usd'),
  totalLatencyMs: integer('total_latency_ms'),
  transcript: text('transcript'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const judgments = sqliteTable('judgments', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  chatId: text('chat_id').references(() => chats.id),
  userId: text('user_id').references(() => users.id),
  promptText: text('prompt_text').notNull(),
  modelAId: text('model_a_id').notNull(),
  modelBId: text('model_b_id').notNull(),
  councilMembers: text('council_members').notNull(),
  winner: text('winner').notNull(),
  promptCategory: text('prompt_category'),
  submittedToPublic: integer('submitted_to_public', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const creditUsage = sqliteTable('credit_usage', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id),
  costUsd: real('cost_usd').notNull(),
  modelId: text('model_id').notNull(),
  requestType: text('request_type').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const statsCache = sqliteTable('stats_cache', {
  key: text('key').primaryKey(),
  value: real('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
