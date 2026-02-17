import { eq, desc, sql } from 'drizzle-orm';
import type { Database } from './client.js';
import {
  publicJudgments,
  leaderboardEntries,
  characterAssignments,
} from './schema.js';
import type {
  NewPublicJudgment,
  PublicJudgment,
  LeaderboardEntry,
  CharacterAssignment,
} from './schema.js';

// ─── Judgments ───────────────────────────────────────────

export async function insertJudgment(
  db: Database,
  judgment: NewPublicJudgment
): Promise<PublicJudgment> {
  const [inserted] = await db
    .insert(publicJudgments)
    .values(judgment)
    .returning();
  return inserted!;
}

export async function getAllJudgments(db: Database): Promise<PublicJudgment[]> {
  return db.select().from(publicJudgments).orderBy(desc(publicJudgments.createdAt));
}

export async function getJudgmentsByModel(
  db: Database,
  modelId: string
): Promise<PublicJudgment[]> {
  return db
    .select()
    .from(publicJudgments)
    .where(
      sql`${publicJudgments.modelAId} = ${modelId} OR ${publicJudgments.modelBId} = ${modelId} OR ${publicJudgments.councilMembers} LIKE ${'%' + modelId + '%'}`
    );
}

// ─── Leaderboard Entries ─────────────────────────────────

export async function getLeaderboard(
  db: Database,
  options?: { limit?: number; entityType?: string }
): Promise<LeaderboardEntry[]> {
  let query = db
    .select()
    .from(leaderboardEntries)
    .orderBy(desc(leaderboardEntries.eloRating));

  if (options?.entityType) {
    query = query.where(eq(leaderboardEntries.entityType, options.entityType)) as typeof query;
  }

  if (options?.limit) {
    query = query.limit(options.limit) as typeof query;
  }

  return query;
}

export async function upsertLeaderboardEntry(
  db: Database,
  entry: {
    entityId: string;
    entityType: string;
    displayName: string;
    wins: number;
    losses: number;
    ties: number;
    eloRating: number;
    winRate: number;
    collaborationIndex?: number;
    totalJudgments: number;
    characterId?: string;
  }
): Promise<LeaderboardEntry> {
  const [upserted] = await db
    .insert(leaderboardEntries)
    .values(entry)
    .onConflictDoUpdate({
      target: leaderboardEntries.entityId,
      set: {
        wins: entry.wins,
        losses: entry.losses,
        ties: entry.ties,
        eloRating: entry.eloRating,
        winRate: entry.winRate,
        collaborationIndex: entry.collaborationIndex,
        totalJudgments: entry.totalJudgments,
        characterId: entry.characterId,
        updatedAt: new Date(),
      },
    })
    .returning();
  return upserted!;
}

export async function getLeaderboardEntry(
  db: Database,
  entityId: string
): Promise<LeaderboardEntry | undefined> {
  const [entry] = await db
    .select()
    .from(leaderboardEntries)
    .where(eq(leaderboardEntries.entityId, entityId));
  return entry;
}

// ─── Character Assignments ───────────────────────────────

export async function getAllCharacterAssignments(
  db: Database
): Promise<CharacterAssignment[]> {
  return db.select().from(characterAssignments);
}

export async function upsertCharacterAssignment(
  db: Database,
  assignment: {
    modelId: string;
    characterId: string;
    characterName: string;
    rationale?: string;
    photoUrl?: string;
    flavorText?: string;
  }
): Promise<CharacterAssignment> {
  const [upserted] = await db
    .insert(characterAssignments)
    .values(assignment)
    .onConflictDoUpdate({
      target: characterAssignments.modelId,
      set: {
        characterId: assignment.characterId,
        characterName: assignment.characterName,
        rationale: assignment.rationale,
        photoUrl: assignment.photoUrl,
        flavorText: assignment.flavorText,
        assignedAt: new Date(),
      },
    })
    .returning();
  return upserted!;
}

export async function getCharacterAssignment(
  db: Database,
  modelId: string
): Promise<CharacterAssignment | undefined> {
  const [assignment] = await db
    .select()
    .from(characterAssignments)
    .where(eq(characterAssignments.modelId, modelId));
  return assignment;
}
