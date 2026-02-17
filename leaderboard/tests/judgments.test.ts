import { describe, it, expect } from 'vitest';
import {
  computeModelStats,
  computeCouncilDelta,
  computeConsistency,
  getPeakCategoryWinRate,
  aggregateForLeaderboard,
} from '../src/server/scoring/aggregation.js';
import type { JudgmentRecord, ModelStats } from '../src/server/scoring/aggregation.js';

describe('Judgment Processing & Aggregation', () => {
  describe('computeModelStats', () => {
    it('should return empty map for empty judgments', () => {
      const result = computeModelStats([]);
      expect(result.size).toBe(0);
    });

    it('should compute basic win/loss/tie counts', () => {
      const judgments: JudgmentRecord[] = [
        {
          winner: 'model_a',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini', 'llama', 'mistral'],
        },
        {
          winner: 'model_b',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini', 'llama', 'mistral'],
        },
        {
          winner: 'tie',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini', 'llama', 'mistral'],
        },
      ];

      const stats = computeModelStats(judgments);

      const claude = stats.get('claude')!;
      expect(claude.wins).toBe(1);
      expect(claude.losses).toBe(1);
      expect(claude.ties).toBe(1);
      expect(claude.totalJudgments).toBe(3);
    });

    it('should compute solo win rate', () => {
      const judgments: JudgmentRecord[] = [
        {
          winner: 'model_a',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini'],
        },
        {
          winner: 'model_a',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini'],
        },
        {
          winner: 'model_b',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini'],
        },
      ];

      const stats = computeModelStats(judgments);

      const claude = stats.get('claude')!;
      expect(claude.soloWins).toBe(2);
      expect(claude.soloLosses).toBe(1);
      expect(claude.soloWinRate).toBeCloseTo(2 / 3, 5);
    });

    it('should compute council win rate for council members', () => {
      const judgments: JudgmentRecord[] = [
        {
          winner: 'council',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini', 'llama', 'mistral'],
        },
        {
          winner: 'model_a',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini', 'llama', 'mistral'],
        },
      ];

      const stats = computeModelStats(judgments);

      const gemini = stats.get('gemini')!;
      expect(gemini.councilWins).toBe(1);
      expect(gemini.councilLosses).toBe(1);
      expect(gemini.councilWinRate).toBeCloseTo(0.5, 5);
    });

    it('should compute collaboration index as council win rate minus solo win rate', () => {
      const judgments: JudgmentRecord[] = [
        // Claude wins solo twice
        {
          winner: 'model_a',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini'],
        },
        {
          winner: 'model_a',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini'],
        },
        // Claude loses solo once
        {
          winner: 'model_b',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini'],
        },
        // Council wins once (claude is member)
        {
          winner: 'council',
          modelAId: 'gpt',
          modelBId: 'gemini',
          councilMembers: ['claude', 'llama', 'mistral'],
        },
        // Council loses once (claude is member)
        {
          winner: 'model_a',
          modelAId: 'gpt',
          modelBId: 'gemini',
          councilMembers: ['claude', 'llama', 'mistral'],
        },
        // Council loses again (claude is member)
        {
          winner: 'model_b',
          modelAId: 'gpt',
          modelBId: 'gemini',
          councilMembers: ['claude', 'llama', 'mistral'],
        },
      ];

      const stats = computeModelStats(judgments);

      const claude = stats.get('claude')!;
      // Solo: 2 wins, 1 loss => 2/3 = 0.667
      expect(claude.soloWinRate).toBeCloseTo(2 / 3, 3);
      // Council: 1 win, 2 losses => 1/3 = 0.333
      expect(claude.councilWinRate).toBeCloseTo(1 / 3, 3);
      // Collaboration index: 0.333 - 0.667 = -0.333
      expect(claude.collaborationIndex).toBeCloseTo(-1 / 3, 3);
    });

    it('should track category-level judgments and win rates', () => {
      const judgments: JudgmentRecord[] = [
        {
          winner: 'model_a',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini'],
          promptCategory: 'code',
        },
        {
          winner: 'model_a',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini'],
          promptCategory: 'code',
        },
        {
          winner: 'model_b',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini'],
          promptCategory: 'creative',
        },
      ];

      const stats = computeModelStats(judgments);
      const claude = stats.get('claude')!;

      // Claude won 2/2 code judgments and 0/1 creative
      expect(claude.categoryWinRates.get('code')).toBeCloseTo(1.0, 5);
      expect(claude.categoryWinRates.get('creative')).toBeCloseTo(0, 5);
      expect(claude.categoryJudgments.get('code')).toBe(2);
      expect(claude.categoryJudgments.get('creative')).toBe(1);
    });

    it('should handle models appearing as both solo and council members', () => {
      const judgments: JudgmentRecord[] = [
        {
          winner: 'model_a',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['claude', 'gemini', 'llama'],
        },
      ];

      const stats = computeModelStats(judgments);
      const claude = stats.get('claude')!;

      // Claude appears as model_a (solo win) and council member (council loss)
      expect(claude.soloWins).toBe(1);
      expect(claude.councilLosses).toBe(1);
      // Total judgments: counted once as model_a, once as council member
      expect(claude.totalJudgments).toBe(2);
    });

    it('should compute overall win rate correctly', () => {
      const judgments: JudgmentRecord[] = [
        {
          winner: 'model_a',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini'],
        },
        {
          winner: 'model_b',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini'],
        },
        {
          winner: 'council',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini'],
        },
      ];

      const stats = computeModelStats(judgments);
      const claude = stats.get('claude')!;

      // Claude: 1 win (model_a), 2 losses => 1/3
      expect(claude.winRate).toBeCloseTo(1 / 3, 3);
    });
  });

  describe('computeCouncilDelta', () => {
    it('should return 0 when model is not in any council', () => {
      const judgments: JudgmentRecord[] = [
        {
          winner: 'council',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini', 'llama', 'mistral'],
        },
      ];

      const delta = computeCouncilDelta('claude', judgments);
      expect(delta).toBe(0);
    });

    it('should compute positive delta when model improves council outcomes', () => {
      const judgments: JudgmentRecord[] = [
        // Councils WITH the model win
        {
          winner: 'council',
          modelAId: 'x',
          modelBId: 'y',
          councilMembers: ['claude', 'gemini', 'llama'],
        },
        {
          winner: 'council',
          modelAId: 'x',
          modelBId: 'y',
          councilMembers: ['claude', 'gemini', 'mistral'],
        },
        // Councils WITHOUT the model lose
        {
          winner: 'model_a',
          modelAId: 'x',
          modelBId: 'y',
          councilMembers: ['gemini', 'llama', 'mistral'],
        },
        {
          winner: 'model_b',
          modelAId: 'x',
          modelBId: 'y',
          councilMembers: ['gemini', 'llama', 'mistral'],
        },
      ];

      const delta = computeCouncilDelta('claude', judgments);
      // With claude: 2/2 = 1.0; without claude: 0/2 = 0.0; delta = 1.0
      expect(delta).toBeCloseTo(1.0, 5);
    });

    it('should compute negative delta when model hurts council outcomes', () => {
      const judgments: JudgmentRecord[] = [
        // Councils WITH the model lose
        {
          winner: 'model_a',
          modelAId: 'x',
          modelBId: 'y',
          councilMembers: ['boromir', 'gemini', 'llama'],
        },
        // Councils WITHOUT the model win
        {
          winner: 'council',
          modelAId: 'x',
          modelBId: 'y',
          councilMembers: ['gemini', 'llama', 'mistral'],
        },
      ];

      const delta = computeCouncilDelta('boromir', judgments);
      // With: 0/1 = 0; without: 1/1 = 1.0; delta = -1.0
      expect(delta).toBeCloseTo(-1.0, 5);
    });
  });

  describe('computeConsistency', () => {
    it('should return 1 for a single category', () => {
      const stats = createMockStats({
        categoryWinRates: new Map([['code', 0.8]]),
      });
      expect(computeConsistency(stats)).toBe(1);
    });

    it('should return 1 for identical win rates across categories', () => {
      const stats = createMockStats({
        categoryWinRates: new Map([
          ['code', 0.5],
          ['creative', 0.5],
          ['reasoning', 0.5],
        ]),
      });
      expect(computeConsistency(stats)).toBeCloseTo(1, 5);
    });

    it('should return lower score for highly variable win rates', () => {
      const consistent = createMockStats({
        categoryWinRates: new Map([
          ['code', 0.5],
          ['creative', 0.5],
        ]),
      });
      const inconsistent = createMockStats({
        categoryWinRates: new Map([
          ['code', 1.0],
          ['creative', 0.0],
        ]),
      });

      expect(computeConsistency(consistent)).toBeGreaterThan(
        computeConsistency(inconsistent)
      );
    });

    it('should return between 0 and 1', () => {
      const stats = createMockStats({
        categoryWinRates: new Map([
          ['code', 0.9],
          ['creative', 0.1],
          ['reasoning', 0.5],
        ]),
      });
      const result = computeConsistency(stats);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('getPeakCategoryWinRate', () => {
    it('should return the highest win rate category', () => {
      const stats = createMockStats({
        categoryWinRates: new Map([
          ['code', 0.9],
          ['creative', 0.3],
          ['reasoning', 0.6],
        ]),
      });

      const result = getPeakCategoryWinRate(stats);
      expect(result.category).toBe('code');
      expect(result.winRate).toBeCloseTo(0.9, 5);
    });

    it('should return unknown with 0 rate when no categories', () => {
      const stats = createMockStats({
        categoryWinRates: new Map(),
      });

      const result = getPeakCategoryWinRate(stats);
      expect(result.category).toBe('unknown');
      expect(result.winRate).toBe(0);
    });
  });

  describe('aggregateForLeaderboard', () => {
    it('should return entries sorted by ELO descending', () => {
      const statsMap = new Map<string, ModelStats>([
        ['claude', createMockStats({ modelId: 'claude', wins: 10, losses: 5 })],
        ['gpt', createMockStats({ modelId: 'gpt', wins: 8, losses: 7 })],
        ['gemini', createMockStats({ modelId: 'gemini', wins: 12, losses: 3 })],
      ]);

      const eloRatings = new Map([
        ['claude', 1100],
        ['gpt', 950],
        ['gemini', 1200],
      ]);

      const entries = aggregateForLeaderboard(statsMap, eloRatings);

      expect(entries).toHaveLength(3);
      expect(entries[0]!.entityId).toBe('gemini');
      expect(entries[1]!.entityId).toBe('claude');
      expect(entries[2]!.entityId).toBe('gpt');
    });

    it('should use default rating 1000 when model has no ELO', () => {
      const statsMap = new Map<string, ModelStats>([
        ['claude', createMockStats({ modelId: 'claude' })],
      ]);

      const eloRatings = new Map<string, number>();

      const entries = aggregateForLeaderboard(statsMap, eloRatings);
      expect(entries[0]!.eloRating).toBe(1000);
    });

    it('should include collaboration index in entries', () => {
      const statsMap = new Map<string, ModelStats>([
        [
          'claude',
          createMockStats({
            modelId: 'claude',
            collaborationIndex: 0.15,
          }),
        ],
      ]);

      const entries = aggregateForLeaderboard(statsMap, new Map([['claude', 1000]]));
      expect(entries[0]!.collaborationIndex).toBeCloseTo(0.15, 5);
    });
  });
});

// Helper to create mock ModelStats with sensible defaults
function createMockStats(overrides: Partial<ModelStats> = {}): ModelStats {
  return {
    modelId: 'test-model',
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
    ...overrides,
  };
}
