import { Hono } from 'hono';
import { db } from '../db/client.js';
import { getLeaderboard } from '../db/queries.js';

const leaderboard = new Hono();

/**
 * GET /api/v1/leaderboard
 *
 * Returns the current leaderboard rankings.
 * Supports optional query parameters:
 * - limit: number of entries to return (default: 50)
 * - type: 'model' | 'council' to filter by entity type
 */
leaderboard.get('/', async (c) => {
  const limitParam = c.req.query('limit');
  const entityType = c.req.query('type');

  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  if (isNaN(limit) || limit < 1 || limit > 200) {
    return c.json({ error: 'limit must be between 1 and 200' }, 400);
  }

  if (entityType && !['model', 'council'].includes(entityType)) {
    return c.json({ error: 'type must be "model" or "council"' }, 400);
  }

  try {
    const entries = await getLeaderboard(db, {
      limit,
      entityType: entityType ?? undefined,
    });

    return c.json({
      entries,
      total: entries.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default leaderboard;
