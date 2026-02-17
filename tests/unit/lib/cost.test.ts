import { describe, it, expect } from 'vitest';
import { calculateCost, estimateRequestCost, formatCost, estimateCouncilCost } from '@/lib/utils/cost';
import { estimateTokens, formatTokenCount } from '@/lib/utils/tokens';
import type { ModelInfo } from '@/types/models';

const mockModel: ModelInfo = {
  id: 'anthropic/claude-opus-4-6',
  name: 'Claude Opus 4.6',
  description: 'Test',
  contextLength: 200000,
  maxCompletionTokens: 4096,
  pricing: { promptPerToken: 0.000015, completionPerToken: 0.000075 },
  provider: 'openrouter',
};

const cheapModel: ModelInfo = {
  id: 'openai/gpt-5-2',
  name: 'GPT-5.2',
  description: 'Test',
  contextLength: 128000,
  maxCompletionTokens: 4096,
  pricing: { promptPerToken: 0.00001, completionPerToken: 0.00003 },
  provider: 'openrouter',
};

describe('calculateCost', () => {
  it('should calculate cost from prompt + completion tokens', () => {
    const cost = calculateCost(mockModel, 1000, 500);
    // 1000 * 0.000015 + 500 * 0.000075 = 0.015 + 0.0375 = 0.0525
    expect(cost).toBeCloseTo(0.0525, 4);
  });

  it('should return 0 for zero tokens', () => {
    expect(calculateCost(mockModel, 0, 0)).toBe(0);
  });
});

describe('estimateRequestCost', () => {
  it('should estimate cost with default completion tokens', () => {
    const cost = estimateRequestCost(mockModel, 100);
    // 100 * 0.000015 + 1000 * 0.000075 = 0.0015 + 0.075 = 0.0765
    expect(cost).toBeCloseTo(0.0765, 4);
  });

  it('should use custom completion token estimate', () => {
    const cost = estimateRequestCost(mockModel, 100, 200);
    // 100 * 0.000015 + 200 * 0.000075 = 0.0015 + 0.015 = 0.0165
    expect(cost).toBeCloseTo(0.0165, 4);
  });
});

describe('estimateCouncilCost', () => {
  it('should estimate higher cost for more members', () => {
    const cost3 = estimateCouncilCost([mockModel, cheapModel, mockModel], 100, 3);
    const cost5 = estimateCouncilCost(
      [mockModel, cheapModel, mockModel, cheapModel, mockModel],
      100,
      3
    );
    expect(cost5).toBeGreaterThan(cost3);
  });

  it('should estimate higher cost for more rounds', () => {
    const cost1 = estimateCouncilCost([mockModel, cheapModel, mockModel], 100, 1);
    const cost5 = estimateCouncilCost([mockModel, cheapModel, mockModel], 100, 5);
    expect(cost5).toBeGreaterThan(cost1);
  });
});

describe('formatCost', () => {
  it('should format small costs with 4 decimal places', () => {
    expect(formatCost(0.001)).toBe('$0.0010');
  });

  it('should format larger costs with 2 decimal places', () => {
    expect(formatCost(0.15)).toBe('$0.15');
    expect(formatCost(1.5)).toBe('$1.50');
  });
});

describe('estimateTokens', () => {
  it('should estimate ~4 chars per token', () => {
    const text = 'Hello world!'; // 12 chars => 3 tokens
    expect(estimateTokens(text)).toBe(3);
  });

  it('should return 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });
});

describe('formatTokenCount', () => {
  it('should format thousands with K suffix', () => {
    expect(formatTokenCount(1500)).toBe('1.5K');
  });

  it('should format millions with M suffix', () => {
    expect(formatTokenCount(1_500_000)).toBe('1.5M');
  });

  it('should show plain number for small counts', () => {
    expect(formatTokenCount(42)).toBe('42');
  });
});
