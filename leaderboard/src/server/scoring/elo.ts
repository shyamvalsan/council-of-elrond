/**
 * ELO / Bradley-Terry scoring system for the Council of Elrond leaderboard.
 *
 * Standard ELO with K=32, initial rating 1000.
 *
 * Scoring rules:
 * - When council wins, all council members get the win.
 * - When an individual model wins, they get the win and the others get losses.
 * - Ties split evenly.
 */

export const K_FACTOR = 32;
export const DEFAULT_RATING = 1000;

/**
 * Calculates the expected score of player A against player B
 * using the standard ELO formula: E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculates the new ELO rating for a player given their current rating,
 * the expected score, and the actual score (1 for win, 0 for loss, 0.5 for tie).
 */
export function newRating(
  currentRating: number,
  expected: number,
  actual: number,
  kFactor: number = K_FACTOR
): number {
  return currentRating + kFactor * (actual - expected);
}

export interface RatingUpdate {
  entityId: string;
  oldRating: number;
  newRating: number;
  delta: number;
}

export interface EloMatchResult {
  updates: RatingUpdate[];
}

/**
 * Gets the current rating for an entity from the ratings map,
 * returning the default rating if not found.
 */
function getRating(ratings: Map<string, number>, entityId: string): number {
  return ratings.get(entityId) ?? DEFAULT_RATING;
}

/**
 * Processes a judgment and returns ELO rating updates for all involved entities.
 *
 * @param winner - 'model_a' | 'model_b' | 'council' | 'tie'
 * @param modelAId - ID of model A
 * @param modelBId - ID of model B
 * @param councilMembers - Array of model IDs in the council
 * @param currentRatings - Map of entity ID to current ELO rating
 * @returns Rating updates for all affected entities
 */
export function processJudgment(
  winner: string,
  modelAId: string,
  modelBId: string,
  councilMembers: string[],
  currentRatings: Map<string, number>
): EloMatchResult {
  const updates: RatingUpdate[] = [];

  // Collect all unique entities involved
  const allEntities = new Set<string>([modelAId, modelBId, ...councilMembers]);

  // Determine actual scores for each entity
  const actualScores = new Map<string, number>();

  switch (winner) {
    case 'model_a': {
      // Model A wins; model B and all council members lose.
      // Set council members first, then the winner, so if model_a
      // is also a council member, the win takes precedence.
      for (const member of councilMembers) {
        actualScores.set(member, 0);
      }
      actualScores.set(modelBId, 0);
      actualScores.set(modelAId, 1);
      break;
    }
    case 'model_b': {
      // Model B wins; model A and all council members lose.
      // Set council members first, then the winner.
      for (const member of councilMembers) {
        actualScores.set(member, 0);
      }
      actualScores.set(modelAId, 0);
      actualScores.set(modelBId, 1);
      break;
    }
    case 'council': {
      // Council wins; all council members get the win, model A and B lose.
      // Set solo models first, then council members, so if a solo model
      // is also a council member, the council win takes precedence.
      actualScores.set(modelAId, 0);
      actualScores.set(modelBId, 0);
      for (const member of councilMembers) {
        actualScores.set(member, 1);
      }
      break;
    }
    case 'tie': {
      // Tie: everyone gets 0.5
      for (const entity of allEntities) {
        actualScores.set(entity, 0.5);
      }
      break;
    }
    default:
      throw new Error(`Invalid winner value: ${winner}`);
  }

  // Calculate average rating of all opponents for each entity
  for (const entityId of allEntities) {
    const entityRating = getRating(currentRatings, entityId);
    const actual = actualScores.get(entityId) ?? 0.5;

    // Calculate expected score against the average of all other entities
    const opponents = [...allEntities].filter((id) => id !== entityId);
    if (opponents.length === 0) continue;

    const avgOpponentRating =
      opponents.reduce((sum, oppId) => sum + getRating(currentRatings, oppId), 0) /
      opponents.length;

    const expected = expectedScore(entityRating, avgOpponentRating);
    const updated = newRating(entityRating, expected, actual);

    updates.push({
      entityId,
      oldRating: entityRating,
      newRating: updated,
      delta: updated - entityRating,
    });
  }

  return { updates };
}

/**
 * Processes multiple judgments sequentially, updating ratings after each.
 * Returns the final ratings map and the list of all updates.
 */
export function processJudgmentBatch(
  judgments: Array<{
    winner: string;
    modelAId: string;
    modelBId: string;
    councilMembers: string[];
  }>,
  initialRatings?: Map<string, number>
): { finalRatings: Map<string, number>; allUpdates: RatingUpdate[] } {
  const ratings = new Map<string, number>(initialRatings ?? []);
  const allUpdates: RatingUpdate[] = [];

  for (const judgment of judgments) {
    const result = processJudgment(
      judgment.winner,
      judgment.modelAId,
      judgment.modelBId,
      judgment.councilMembers,
      ratings
    );

    for (const update of result.updates) {
      ratings.set(update.entityId, update.newRating);
      allUpdates.push(update);
    }
  }

  return { finalRatings: ratings, allUpdates };
}
