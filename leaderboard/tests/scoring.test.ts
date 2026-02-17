import { describe, it, expect } from 'vitest';
import {
  expectedScore,
  newRating,
  processJudgment,
  processJudgmentBatch,
  K_FACTOR,
  DEFAULT_RATING,
} from '../src/server/scoring/elo.js';

describe('ELO Scoring', () => {
  describe('expectedScore', () => {
    it('should return 0.5 for equal ratings', () => {
      const result = expectedScore(1000, 1000);
      expect(result).toBeCloseTo(0.5, 5);
    });

    it('should return higher expected score for higher-rated player', () => {
      const result = expectedScore(1200, 1000);
      expect(result).toBeGreaterThan(0.5);
      expect(result).toBeLessThan(1);
    });

    it('should return lower expected score for lower-rated player', () => {
      const result = expectedScore(800, 1000);
      expect(result).toBeLessThan(0.5);
      expect(result).toBeGreaterThan(0);
    });

    it('should return complementary scores for swapped ratings', () => {
      const scoreA = expectedScore(1200, 1000);
      const scoreB = expectedScore(1000, 1200);
      expect(scoreA + scoreB).toBeCloseTo(1.0, 5);
    });

    it('should return ~0.76 for a 200 point advantage', () => {
      const result = expectedScore(1200, 1000);
      expect(result).toBeCloseTo(0.7597, 3);
    });

    it('should return ~0.91 for a 400 point advantage', () => {
      const result = expectedScore(1400, 1000);
      expect(result).toBeCloseTo(0.9091, 3);
    });
  });

  describe('newRating', () => {
    it('should increase rating on a win when expected to lose', () => {
      const result = newRating(1000, 0.25, 1);
      expect(result).toBeGreaterThan(1000);
    });

    it('should decrease rating on a loss when expected to win', () => {
      const result = newRating(1200, 0.75, 0);
      expect(result).toBeLessThan(1200);
    });

    it('should not change rating when actual equals expected', () => {
      const result = newRating(1000, 0.5, 0.5);
      expect(result).toBeCloseTo(1000, 5);
    });

    it('should use K_FACTOR of 32 by default', () => {
      // Win with 0.5 expected => +16
      const result = newRating(1000, 0.5, 1);
      expect(result).toBeCloseTo(1016, 5);
    });

    it('should respect custom K factor', () => {
      const result = newRating(1000, 0.5, 1, 16);
      expect(result).toBeCloseTo(1008, 5);
    });

    it('should give maximum gain of K when winning with 0 expected', () => {
      const result = newRating(1000, 0, 1);
      expect(result).toBeCloseTo(1000 + K_FACTOR, 5);
    });

    it('should give maximum loss of K when losing with 1.0 expected', () => {
      const result = newRating(1000, 1, 0);
      expect(result).toBeCloseTo(1000 - K_FACTOR, 5);
    });
  });

  describe('processJudgment', () => {
    it('should give win to model_a and losses to others when model_a wins', () => {
      const ratings = new Map<string, number>();
      const result = processJudgment(
        'model_a',
        'claude',
        'gpt',
        ['claude', 'gpt', 'gemini'],
        ratings
      );

      const claudeUpdate = result.updates.find((u) => u.entityId === 'claude');
      const gptUpdate = result.updates.find((u) => u.entityId === 'gpt');
      const geminiUpdate = result.updates.find((u) => u.entityId === 'gemini');

      expect(claudeUpdate).toBeDefined();
      expect(gptUpdate).toBeDefined();
      expect(geminiUpdate).toBeDefined();

      // Claude wins as model_a => rating goes up
      expect(claudeUpdate!.delta).toBeGreaterThan(0);
      // GPT loses as model_b => rating goes down
      expect(gptUpdate!.delta).toBeLessThan(0);
      // Gemini is council member, council lost => rating goes down
      expect(geminiUpdate!.delta).toBeLessThan(0);
    });

    it('should give win to model_b and losses to others when model_b wins', () => {
      const ratings = new Map<string, number>();
      const result = processJudgment(
        'model_b',
        'claude',
        'gpt',
        ['claude', 'gpt', 'gemini'],
        ratings
      );

      const claudeUpdate = result.updates.find((u) => u.entityId === 'claude');
      const gptUpdate = result.updates.find((u) => u.entityId === 'gpt');

      expect(claudeUpdate!.delta).toBeLessThan(0);
      expect(gptUpdate!.delta).toBeGreaterThan(0);
    });

    it('should give wins to all council members when council wins', () => {
      const ratings = new Map<string, number>();
      const result = processJudgment(
        'council',
        'claude',
        'gpt',
        ['claude', 'gpt', 'gemini'],
        ratings
      );

      const claudeUpdate = result.updates.find((u) => u.entityId === 'claude');
      const gptUpdate = result.updates.find((u) => u.entityId === 'gpt');
      const geminiUpdate = result.updates.find((u) => u.entityId === 'gemini');

      // All council members win
      expect(geminiUpdate!.delta).toBeGreaterThan(0);

      // Claude and GPT are both council members AND solo losers
      // As council members they win, but as solo they lose.
      // Since in this implementation they get council win (score=1 for council members,
      // score=0 for solo losers), and claude is in council, claude gets score=1.
      // But claude is also model_a which gets score=0 when council wins.
      // The code sets council members to 1, which overrides model_a=0.
      // Let's verify: council members get 1, and model_a/model_b get 0 initially,
      // but if a model is BOTH model_a and a council member, the council loop runs last
      // and sets it to 1.
      expect(claudeUpdate!.delta).toBeGreaterThan(0);
      expect(gptUpdate!.delta).toBeGreaterThan(0);
    });

    it('should give 0.5 to everyone on tie', () => {
      const ratings = new Map<string, number>();
      const result = processJudgment(
        'tie',
        'claude',
        'gpt',
        ['gemini', 'llama', 'mistral'],
        ratings
      );

      // All entities start at 1000, all get 0.5 actual vs 0.5 expected
      // So all deltas should be approximately 0
      for (const update of result.updates) {
        expect(Math.abs(update.delta)).toBeLessThan(0.01);
      }
    });

    it('should use default rating of 1000 for unrated models', () => {
      const ratings = new Map<string, number>();
      const result = processJudgment(
        'model_a',
        'claude',
        'gpt',
        ['gemini', 'llama', 'mistral'],
        ratings
      );

      for (const update of result.updates) {
        expect(update.oldRating).toBe(DEFAULT_RATING);
      }
    });

    it('should use existing ratings when provided', () => {
      const ratings = new Map<string, number>([
        ['claude', 1200],
        ['gpt', 1100],
        ['gemini', 900],
      ]);
      const result = processJudgment(
        'model_a',
        'claude',
        'gpt',
        ['gemini'],
        ratings
      );

      const claudeUpdate = result.updates.find((u) => u.entityId === 'claude');
      expect(claudeUpdate!.oldRating).toBe(1200);
    });

    it('should handle models appearing in both solo and council positions', () => {
      // claude is model_a AND a council member
      const ratings = new Map<string, number>();
      const result = processJudgment(
        'model_a',
        'claude',
        'gpt',
        ['claude', 'gemini', 'llama'],
        ratings
      );

      // claude appears as model_a (winner) and council member (loser).
      // When model_a wins, the solo winner takes precedence over council membership,
      // so claude gets score 1 (win).
      const claudeUpdate = result.updates.find((u) => u.entityId === 'claude');
      expect(claudeUpdate).toBeDefined();
      expect(claudeUpdate!.delta).toBeGreaterThan(0);
      // There should be exactly one update per entity (deduped by the Set)
      const claudeUpdates = result.updates.filter((u) => u.entityId === 'claude');
      expect(claudeUpdates).toHaveLength(1);
    });

    it('should throw on invalid winner value', () => {
      const ratings = new Map<string, number>();
      expect(() =>
        processJudgment('invalid', 'claude', 'gpt', ['gemini'], ratings)
      ).toThrow('Invalid winner value');
    });
  });

  describe('processJudgmentBatch', () => {
    it('should process empty batch and return empty results', () => {
      const result = processJudgmentBatch([]);
      expect(result.finalRatings.size).toBe(0);
      expect(result.allUpdates).toHaveLength(0);
    });

    it('should accumulate ratings across multiple judgments', () => {
      const judgments = [
        {
          winner: 'model_a',
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

      const result = processJudgmentBatch(judgments);

      // Claude should have gained rating from two wins
      const claudeRating = result.finalRatings.get('claude')!;
      expect(claudeRating).toBeGreaterThan(DEFAULT_RATING);

      // GPT should have lost rating from two losses
      const gptRating = result.finalRatings.get('gpt')!;
      expect(gptRating).toBeLessThan(DEFAULT_RATING);
    });

    it('should use initial ratings when provided', () => {
      const initial = new Map<string, number>([
        ['claude', 1200],
        ['gpt', 800],
      ]);

      const judgments = [
        {
          winner: 'model_a',
          modelAId: 'claude',
          modelBId: 'gpt',
          councilMembers: ['gemini', 'llama', 'mistral'],
        },
      ];

      const result = processJudgmentBatch(judgments, initial);
      const claudeRating = result.finalRatings.get('claude')!;
      expect(claudeRating).toBeGreaterThan(1200);
    });

    it('should produce sequential updates where later judgments use updated ratings', () => {
      const judgments = [
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

      const result = processJudgmentBatch(judgments);

      // After first judgment, claude wins. After second, gpt wins.
      // The second judgment uses the updated ratings from the first.
      // So the final ratings should be close to 1000 for both, but not exactly.
      const claudeRating = result.finalRatings.get('claude')!;
      const gptRating = result.finalRatings.get('gpt')!;

      // Both should be relatively close to 1000 since they each won once
      expect(Math.abs(claudeRating - DEFAULT_RATING)).toBeLessThan(5);
      expect(Math.abs(gptRating - DEFAULT_RATING)).toBeLessThan(5);
    });
  });

  describe('Constants', () => {
    it('should have K_FACTOR of 32', () => {
      expect(K_FACTOR).toBe(32);
    });

    it('should have DEFAULT_RATING of 1000', () => {
      expect(DEFAULT_RATING).toBe(1000);
    });
  });
});
