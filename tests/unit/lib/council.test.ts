import { describe, it, expect } from 'vitest';
import { CouncilEngine } from '@/lib/llm/council';
import type { CouncilStreamEvent } from '@/types/council';

describe('CouncilEngine', () => {
  describe('constructor validation', () => {
    it('should throw if fewer than 3 members', () => {
      expect(
        () =>
          new CouncilEngine({
            members: ['model-a', 'model-b'],
            contextBudget: 16384,
            userPrompt: 'test',
          })
      ).toThrow('Council requires minimum 3 members');
    });

    it('should throw if more than 12 members', () => {
      const tooMany = Array.from({ length: 13 }, (_, i) => `model-${i}`);
      expect(
        () =>
          new CouncilEngine({
            members: tooMany,
            contextBudget: 16384,
            userPrompt: 'test',
          })
      ).toThrow('Council allows maximum 12 members');
    });

    it('should accept valid configuration', () => {
      expect(
        () =>
          new CouncilEngine({
            members: ['anthropic/claude-opus-4-6', 'openai/gpt-5-2', 'google/gemini-3-pro-preview'],
            contextBudget: 16384,
            userPrompt: 'What is the meaning of life?',
          })
      ).not.toThrow();
    });

    it('should accept 12 members', () => {
      const members = Array.from({ length: 12 }, (_, i) => `model-${i}`);
      expect(
        () =>
          new CouncilEngine({
            members,
            contextBudget: 16384,
            userPrompt: 'test',
          })
      ).not.toThrow();
    });
  });

  describe('deliberation', () => {
    it('should emit budget events', async () => {
      const engine = new CouncilEngine(
        {
          members: [
            'anthropic/claude-opus-4-6',
            'openai/gpt-5-2',
            'google/gemini-3-pro-preview',
          ],
          contextBudget: 16384,
          userPrompt: 'Hello world',
        },
        { openrouter: 'sk-or-test' }
      );

      const events: CouncilStreamEvent[] = [];
      for await (const event of engine.deliberate()) {
        events.push(event);
      }

      const budgetEvents = events.filter((e) => e.type === 'budget');
      expect(budgetEvents.length).toBeGreaterThan(0);
    });

    it('should emit turn_start and turn_end events for each model turn', async () => {
      const members = [
        'anthropic/claude-opus-4-6',
        'openai/gpt-5-2',
        'google/gemini-3-pro-preview',
      ];

      const engine = new CouncilEngine(
        {
          members,
          contextBudget: 16384,
          userPrompt: 'Hello',
        },
        { openrouter: 'sk-or-test' }
      );

      const events: CouncilStreamEvent[] = [];
      for await (const event of engine.deliberate()) {
        events.push(event);
      }

      const turnStarts = events.filter((e) => e.type === 'turn_start');
      const turnEnds = events.filter((e) => e.type === 'turn_end');
      // At minimum: 3 opening turns
      expect(turnStarts.length).toBeGreaterThanOrEqual(3);
      expect(turnEnds.length).toEqual(turnStarts.length);
    });

    it('should emit a final_answer event', async () => {
      const engine = new CouncilEngine(
        {
          members: [
            'anthropic/claude-opus-4-6',
            'openai/gpt-5-2',
            'google/gemini-3-pro-preview',
          ],
          contextBudget: 16384,
          userPrompt: 'Hello',
        },
        { openrouter: 'sk-or-test' }
      );

      const events: CouncilStreamEvent[] = [];
      for await (const event of engine.deliberate()) {
        events.push(event);
      }

      const finalAnswers = events.filter((e) => e.type === 'final_answer');
      expect(finalAnswers.length).toBe(1);
    });

    it('should emit stats before the final event', async () => {
      const engine = new CouncilEngine(
        {
          members: [
            'anthropic/claude-opus-4-6',
            'openai/gpt-5-2',
            'google/gemini-3-pro-preview',
          ],
          contextBudget: 16384,
          userPrompt: 'Hello',
        },
        { openrouter: 'sk-or-test' }
      );

      const events: CouncilStreamEvent[] = [];
      for await (const event of engine.deliberate()) {
        events.push(event);
      }

      const statsEvents = events.filter((e) => e.type === 'stats');
      expect(statsEvents.length).toBe(1);
      const stats = statsEvents[0] as { type: 'stats'; tokens: number; cost: number; latencyMs: number };
      expect(stats.tokens).toBeGreaterThan(0);
      expect(stats.latencyMs).toBeGreaterThan(0);
    });
  });
});
