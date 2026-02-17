import { Hono } from 'hono';
import { db } from '../db/client.js';
import { getAllCharacterAssignments } from '../db/queries.js';
import { CHARACTERS } from '../scoring/character-mapping.js';

const characters = new Hono();

/**
 * GET /api/v1/characters
 *
 * Returns all current model-to-LOTR character assignments.
 * Each assignment includes the character definition, rationale, and flavor text.
 */
characters.get('/', async (c) => {
  try {
    const assignments = await getAllCharacterAssignments(db);

    // Enrich assignments with character definitions
    const enriched = assignments.map((assignment) => {
      const characterDef = CHARACTERS.find(
        (ch) => ch.id === assignment.characterId
      );
      return {
        ...assignment,
        archetype: characterDef?.archetype ?? null,
        characterDescription: characterDef?.description ?? null,
      };
    });

    return c.json({
      assignments: enriched,
      availableCharacters: CHARACTERS,
      total: enriched.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch character assignments:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default characters;
