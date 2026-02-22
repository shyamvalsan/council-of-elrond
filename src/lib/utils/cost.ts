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
 * Estimate total council cost based on context budget.
 * In free-form deliberation, the budget determines total token usage.
 */
export function estimateCouncilCost(
  models: ModelInfo[],
  promptTokens: number,
  contextBudget: number
): number {
  // Estimate: budget is split roughly evenly among members for completion tokens,
  // plus each member sees the growing prompt context each turn.
  // Rough heuristic: total cost ~ avg model cost * budget tokens
  const memberCount = models.length;
  const avgCompletionPerMember = contextBudget / memberCount;

  let totalCost = 0;
  for (const model of models) {
    totalCost += calculateCost(model, promptTokens, avgCompletionPerMember);
  }

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
