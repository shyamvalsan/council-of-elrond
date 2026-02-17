import { eq, desc, sql, and, gte, like } from 'drizzle-orm';
import { db } from './client';
import {
  users,
  chats,
  messages,
  councilSessions,
  judgments,
  creditUsage,
  statsCache,
} from './schema';

// ── Users ──
export async function getOrCreateUser(userId?: string) {
  if (userId) {
    const existing = db.select().from(users).where(eq(users.id, userId)).get();
    if (existing) return existing;
  }
  const id = crypto.randomUUID();
  db.insert(users).values({ id }).run();
  return db.select().from(users).where(eq(users.id, id)).get()!;
}

// ── Chats ──
export async function createChat(userId: string, title?: string) {
  const id = crypto.randomUUID();
  db.insert(chats).values({ id, userId, title }).run();
  return db.select().from(chats).where(eq(chats.id, id)).get()!;
}

export async function getUserChats(userId: string) {
  return db.select().from(chats).where(eq(chats.userId, userId)).orderBy(desc(chats.updatedAt)).all();
}

export async function searchChats(userId: string, query: string) {
  return db
    .select()
    .from(chats)
    .where(and(eq(chats.userId, userId), like(chats.title, `%${query}%`)))
    .orderBy(desc(chats.updatedAt))
    .all();
}

// ── Messages ──
export async function addMessage(data: {
  chatId: string;
  role: string;
  modelId?: string;
  content: string;
  tokenCount?: number;
  costUsd?: number;
  latencyMs?: number;
  fundedBy?: string;
}) {
  const id = crypto.randomUUID();
  db.insert(messages)
    .values({ id, ...data })
    .run();
  return db.select().from(messages).where(eq(messages.id, id)).get()!;
}

export async function getChatMessages(chatId: string) {
  return db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(messages.createdAt).all();
}

// ── Council Sessions ──
export async function createCouncilSession(data: {
  chatId: string;
  messageId: string;
  memberModels: string[];
  numRounds: number;
  totalTokens: number;
  totalCostUsd: number;
  totalLatencyMs: number;
  transcript: unknown;
}) {
  const id = crypto.randomUUID();
  db.insert(councilSessions)
    .values({
      id,
      chatId: data.chatId,
      messageId: data.messageId,
      memberModels: JSON.stringify(data.memberModels),
      numRounds: data.numRounds,
      totalTokens: data.totalTokens,
      totalCostUsd: data.totalCostUsd,
      totalLatencyMs: data.totalLatencyMs,
      transcript: JSON.stringify(data.transcript),
    })
    .run();
  return db.select().from(councilSessions).where(eq(councilSessions.id, id)).get()!;
}

// ── Judgments ──
export async function createJudgment(data: {
  chatId: string;
  userId: string;
  promptText: string;
  modelAId: string;
  modelBId: string;
  councilMembers: string[];
  winner: string;
  promptCategory?: string;
}) {
  const id = crypto.randomUUID();
  db.insert(judgments)
    .values({
      id,
      ...data,
      councilMembers: JSON.stringify(data.councilMembers),
    })
    .run();
  return db.select().from(judgments).where(eq(judgments.id, id)).get()!;
}

export async function markJudgmentPublic(judgmentId: string) {
  db.update(judgments).set({ submittedToPublic: true }).where(eq(judgments.id, judgmentId)).run();
}

// ── Credit Usage ──
export async function recordCreditUsage(data: {
  userId: string;
  costUsd: number;
  modelId: string;
  requestType: string;
}) {
  const id = crypto.randomUUID();
  db.insert(creditUsage).values({ id, ...data }).run();
}

export async function getUserDailySpend(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const result = db
    .select({ total: sql<number>`COALESCE(SUM(${creditUsage.costUsd}), 0)` })
    .from(creditUsage)
    .where(
      and(
        eq(creditUsage.userId, userId),
        gte(creditUsage.createdAt, startOfDay)
      )
    )
    .get();
  return result?.total ?? 0;
}

// ── Stats Cache ──
export async function getStatsCacheValue(key: string): Promise<number | null> {
  const row = db.select().from(statsCache).where(eq(statsCache.key, key)).get();
  return row?.value ?? null;
}

export async function setStatsCacheValue(key: string, value: number) {
  db.insert(statsCache)
    .values({ key, value })
    .onConflictDoUpdate({ target: statsCache.key, set: { value, updatedAt: sql`(unixepoch())` } })
    .run();
}

export async function computeAndCacheStats() {
  const totalUsers = db
    .select({ count: sql<number>`COUNT(DISTINCT ${users.id})` })
    .from(users)
    .get();
  await setStatsCacheValue('total_users', totalUsers?.count ?? 0);

  const totalTokens = db
    .select({ total: sql<number>`COALESCE(SUM(${messages.tokenCount}), 0)` })
    .from(messages)
    .get();
  await setStatsCacheValue('total_tokens', totalTokens?.total ?? 0);

  const totalJudgments = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(judgments)
    .get();
  await setStatsCacheValue('total_judgments', totalJudgments?.count ?? 0);
}
