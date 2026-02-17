import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/client.js';
import { insertJudgment } from '../db/queries.js';

const judgmentSchema = z.object({
  promptHash: z.string().min(1),
  promptCategory: z.string().optional(),
  modelAId: z.string().min(1),
  modelBId: z.string().min(1),
  councilMembers: z.array(z.string().min(1)).min(3).max(12),
  winner: z.enum(['model_a', 'model_b', 'council', 'tie']),
  sourceInstance: z.string().optional(),
});

export type JudgmentInput = z.infer<typeof judgmentSchema>;

const judgments = new Hono();

/**
 * POST /api/v1/judgments
 *
 * Submit a new judgment from a Council of Elrond instance.
 * Validates the input, stores in the database, and returns the created judgment.
 */
judgments.post('/', async (c) => {
  const body = await c.req.json();

  const parsed = judgmentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      },
      400
    );
  }

  const { data } = parsed;

  try {
    const judgment = await insertJudgment(db, {
      promptHash: data.promptHash,
      promptCategory: data.promptCategory ?? null,
      modelAId: data.modelAId,
      modelBId: data.modelBId,
      councilMembers: JSON.stringify(data.councilMembers),
      winner: data.winner,
      sourceInstance: data.sourceInstance ?? null,
    });

    return c.json({ success: true, judgment }, 201);
  } catch (error) {
    console.error('Failed to insert judgment:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default judgments;
