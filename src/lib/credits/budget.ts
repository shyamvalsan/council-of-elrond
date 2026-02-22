import type { ModelInfo } from '@/types/models';
import { estimateRequestCost, estimateCouncilCost } from '../utils/cost';
import { estimateTokens } from '../utils/tokens';

export interface CostEstimate {
  modelACost: number;
  modelBCost: number;
  councilCost: number;
  totalCost: number;
}

/**
 * Estimate the total cost of a triple-view query before execution.
 */
export function estimateTripleViewCost(
  prompt: string,
  modelA: ModelInfo,
  modelB: ModelInfo,
  councilModels: ModelInfo[],
  contextBudget: number = 16384
): CostEstimate {
  const promptTokens = estimateTokens(prompt);

  const modelACost = estimateRequestCost(modelA, promptTokens);
  const modelBCost = estimateRequestCost(modelB, promptTokens);
  const councilCost = estimateCouncilCost(councilModels, promptTokens, contextBudget);

  return {
    modelACost,
    modelBCost,
    councilCost,
    totalCost: modelACost + modelBCost + councilCost,
  };
}

/**
 * Format a cost estimate for display.
 */
export function formatCostEstimate(estimate: CostEstimate): string {
  const fmt = (n: number) => `$${n.toFixed(2)}`;
  return [
    `Estimated cost: ~${fmt(estimate.totalCost)}`,
    `  Model A: ~${fmt(estimate.modelACost)}`,
    `  Model B: ~${fmt(estimate.modelBCost)}`,
    `  Council: ~${fmt(estimate.councilCost)}`,
  ].join('\n');
}
