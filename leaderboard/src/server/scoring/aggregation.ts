/**
 * Stats computation and aggregation for leaderboard entries.
 * Computes win rates, collaboration indices, category breakdowns, etc.
 */

export interface JudgmentRecord {
  winner: string;           // 'model_a' | 'model_b' | 'council' | 'tie'
  modelAId: string;
  modelBId: string;
  councilMembers: string[]; // Array of model IDs in the council
  promptCategory?: string | null;
}

export interface ModelStats {
  modelId: string;
  wins: number;
  losses: number;
  ties: number;
  totalJudgments: number;
  winRate: number;
  soloWins: number;
  soloLosses: number;
  soloWinRate: number;
  councilWins: number;
  councilLosses: number;
  councilWinRate: number;
  collaborationIndex: number;
  categoryWinRates: Map<string, number>;
  categoryJudgments: Map<string, number>;
  synthesizerWins: number;
  synthesizerTotal: number;
  errorRate: number;
  councilDelta: number;        // avg delta when added to council
  additionalRoundTriggers: number;
}

/**
 * Compute detailed stats for each model from a list of judgments.
 */
export function computeModelStats(judgments: JudgmentRecord[]): Map<string, ModelStats> {
  const statsMap = new Map<string, ModelStats>();

  function getOrCreate(modelId: string): ModelStats {
    let stats = statsMap.get(modelId);
    if (!stats) {
      stats = {
        modelId,
        wins: 0,
        losses: 0,
        ties: 0,
        totalJudgments: 0,
        winRate: 0,
        soloWins: 0,
        soloLosses: 0,
        soloWinRate: 0,
        councilWins: 0,
        councilLosses: 0,
        councilWinRate: 0,
        collaborationIndex: 0,
        categoryWinRates: new Map(),
        categoryJudgments: new Map(),
        synthesizerWins: 0,
        synthesizerTotal: 0,
        errorRate: 0,
        councilDelta: 0,
        additionalRoundTriggers: 0,
      };
      statsMap.set(modelId, stats);
    }
    return stats;
  }

  for (const judgment of judgments) {
    const { winner, modelAId, modelBId, councilMembers } = judgment;
    const category = judgment.promptCategory ?? 'unknown';

    // Track stats for model A (solo)
    const statsA = getOrCreate(modelAId);
    statsA.totalJudgments++;
    incrementCategory(statsA.categoryJudgments, category);

    if (winner === 'model_a') {
      statsA.wins++;
      statsA.soloWins++;
      incrementCategory(statsA.categoryWinRates, category);
    } else if (winner === 'tie') {
      statsA.ties++;
    } else {
      statsA.losses++;
      statsA.soloLosses++;
    }

    // Track stats for model B (solo)
    const statsB = getOrCreate(modelBId);
    statsB.totalJudgments++;
    incrementCategory(statsB.categoryJudgments, category);

    if (winner === 'model_b') {
      statsB.wins++;
      statsB.soloWins++;
      incrementCategory(statsB.categoryWinRates, category);
    } else if (winner === 'tie') {
      statsB.ties++;
    } else {
      statsB.losses++;
      statsB.soloLosses++;
    }

    // Track stats for council members
    for (const memberId of councilMembers) {
      const memberStats = getOrCreate(memberId);
      memberStats.totalJudgments++;
      incrementCategory(memberStats.categoryJudgments, category);

      if (winner === 'council') {
        memberStats.wins++;
        memberStats.councilWins++;
        incrementCategory(memberStats.categoryWinRates, category);
      } else if (winner === 'tie') {
        memberStats.ties++;
      } else {
        memberStats.losses++;
        memberStats.councilLosses++;
      }
    }
  }

  // Compute derived stats
  for (const stats of statsMap.values()) {
    // Overall win rate
    stats.winRate =
      stats.totalJudgments > 0 ? stats.wins / stats.totalJudgments : 0;

    // Solo win rate
    const soloTotal = stats.soloWins + stats.soloLosses;
    stats.soloWinRate = soloTotal > 0 ? stats.soloWins / soloTotal : 0;

    // Council win rate
    const councilTotal = stats.councilWins + stats.councilLosses;
    stats.councilWinRate = councilTotal > 0 ? stats.councilWins / councilTotal : 0;

    // Collaboration index: how much better the model performs in councils vs solo
    // Positive = better in council, negative = worse in council
    if (soloTotal > 0 && councilTotal > 0) {
      stats.collaborationIndex = stats.councilWinRate - stats.soloWinRate;
    } else {
      stats.collaborationIndex = 0;
    }

    // Compute category win rates (convert from raw win counts to rates)
    // Iterate over categoryJudgments so we include categories with 0 wins
    const winCounts = new Map(stats.categoryWinRates);
    stats.categoryWinRates = new Map();
    for (const [cat, catJudgments] of stats.categoryJudgments.entries()) {
      const winCount = winCounts.get(cat) ?? 0;
      stats.categoryWinRates.set(cat, catJudgments > 0 ? winCount / catJudgments : 0);
    }
  }

  return statsMap;
}

function incrementCategory(map: Map<string, number>, category: string): void {
  map.set(category, (map.get(category) ?? 0) + 1);
}

/**
 * Compute the average council delta for a model.
 * The delta is the difference in council win rate when this model is included
 * vs. the average council win rate when it is not.
 */
export function computeCouncilDelta(
  modelId: string,
  judgments: JudgmentRecord[]
): number {
  const withModel = judgments.filter(
    (j) => j.councilMembers.includes(modelId)
  );
  const withoutModel = judgments.filter(
    (j) =>
      !j.councilMembers.includes(modelId) &&
      j.councilMembers.length > 0
  );

  if (withModel.length === 0) return 0;

  const winRateWith =
    withModel.filter((j) => j.winner === 'council').length / withModel.length;

  const winRateWithout =
    withoutModel.length > 0
      ? withoutModel.filter((j) => j.winner === 'council').length / withoutModel.length
      : 0;

  return winRateWith - winRateWithout;
}

/**
 * Compute the consistency score for a model across all categories.
 * Lower variance = higher consistency (Aragorn criterion).
 * Returns a score between 0 and 1, where 1 = perfectly consistent.
 */
export function computeConsistency(stats: ModelStats): number {
  const rates = [...stats.categoryWinRates.values()];
  if (rates.length <= 1) return 1; // single category = perfectly consistent

  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  const variance =
    rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length;

  // Convert variance to a 0-1 consistency score
  // variance of 0 = consistency 1; higher variance = lower consistency
  return 1 / (1 + variance * 10);
}

/**
 * Get the peak category win rate for a model (Glorfindel criterion).
 */
export function getPeakCategoryWinRate(stats: ModelStats): {
  category: string;
  winRate: number;
} {
  let peakCategory = 'unknown';
  let peakRate = 0;

  for (const [category, winRate] of stats.categoryWinRates.entries()) {
    if (winRate > peakRate) {
      peakRate = winRate;
      peakCategory = category;
    }
  }

  return { category: peakCategory, winRate: peakRate };
}

/**
 * Aggregate leaderboard stats for serialization to the API.
 */
export function aggregateForLeaderboard(
  statsMap: Map<string, ModelStats>,
  eloRatings: Map<string, number>
): Array<{
  entityId: string;
  entityType: string;
  displayName: string;
  wins: number;
  losses: number;
  ties: number;
  eloRating: number;
  winRate: number;
  collaborationIndex: number;
  totalJudgments: number;
}> {
  const entries = [];

  for (const [modelId, stats] of statsMap.entries()) {
    entries.push({
      entityId: modelId,
      entityType: 'model' as const,
      displayName: modelId, // can be enriched with display names later
      wins: stats.wins,
      losses: stats.losses,
      ties: stats.ties,
      eloRating: eloRatings.get(modelId) ?? 1000,
      winRate: stats.winRate,
      collaborationIndex: stats.collaborationIndex,
      totalJudgments: stats.totalJudgments,
    });
  }

  // Sort by ELO rating descending
  entries.sort((a, b) => b.eloRating - a.eloRating);

  return entries;
}
