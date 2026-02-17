import { describe, it, expect } from 'vitest';
import { estimateTokens, formatTokenCount } from '@/lib/utils/tokens';

describe('Stats API Integration', () => {
  it('should format community stats correctly', () => {
    const stats = {
      totalUsers: 2847,
      totalTokens: 14200000,
      totalJudgments: 1203,
    };

    expect(stats.totalUsers).toBeGreaterThan(0);
    expect(formatTokenCount(stats.totalTokens)).toBe('14.2M');
    expect(stats.totalJudgments).toBeGreaterThan(0);
  });

  it('should handle zero stats', () => {
    const stats = {
      totalUsers: 0,
      totalTokens: 0,
      totalJudgments: 0,
    };

    expect(formatTokenCount(stats.totalTokens)).toBe('0');
  });

  it('should estimate tokens for various input lengths', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('hello')).toBeGreaterThan(0);
    expect(estimateTokens('a'.repeat(1000))).toBe(250); // ~4 chars/token
  });
});
