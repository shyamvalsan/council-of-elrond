import type { ModelInfo } from '@/types/models';

/**
 * Calculate cost for a given number of prompt and completion tokens.
 */
export function calculateCost(
  model: ModelInfo,
  promptTokens: number,
  completionTokens: number
): number {
  return (
    promptTokens * model.pricing.promptPerToken +
    completionTokens * model.pricing.completionPerToken
  );
}

/**
 * Estimate cost for a request before execution.
 * Assumes average response length based on model context.
 */
export function estimateRequestCost(
  model: ModelInfo,
  promptTokens: number,
  estimatedCompletionTokens: number = 1000
): number {
  return calculateCost(model, promptTokens, estimatedCompletionTokens);
}

/**
 * Estimate total council cost.
 */
export function estimateCouncilCost(
  models: ModelInfo[],
  promptTokens: number,
  maxRounds: number,
  estimatedResponseTokens: number = 500
): number {
  const memberCount = models.length;
  // Each member drafts once + critiques per round + synthesis per round
  // Rough estimate: each member generates ~estimatedResponseTokens per phase
  // Phases: acquaintance(1) + draft(1) + (critique + synthesis)(per round)
  const tokensPerMemberPerRound = estimatedResponseTokens * 2; // critique + discussion
  const synthTokensPerRound = estimatedResponseTokens;

  let totalCost = 0;
  for (const model of models) {
    // Draft phase
    const draftCost = calculateCost(model, promptTokens, estimatedResponseTokens);
    // Deliberation rounds
    const roundCost =
      maxRounds *
      calculateCost(model, promptTokens + estimatedResponseTokens * memberCount, tokensPerMemberPerRound);
    totalCost += draftCost + roundCost;
  }

  // Synthesis cost (one model per round)
  const avgModel = models[0];
  totalCost += maxRounds * calculateCost(avgModel, promptTokens * 2, synthTokensPerRound);

  return totalCost;
}

/**
 * Format cost for display.
 */
export function formatCost(costUsd: number): string {
  if (costUsd < 0.01) {
    return `$${costUsd.toFixed(4)}`;
  }
  return `$${costUsd.toFixed(2)}`;
}
