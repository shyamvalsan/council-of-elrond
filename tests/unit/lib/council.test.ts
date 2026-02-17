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
            maxRounds: 3,
            convergenceThreshold: 1.0,
            userPrompt: 'test',
            synthesizerStrategy: 'round-robin',
          })
      ).toThrow('Council requires minimum 3 members');
    });

    it('should throw if more than 12 members', () => {
      const tooMany = Array.from({ length: 13 }, (_, i) => `model-${i}`);
      expect(
        () =>
          new CouncilEngine({
            members: tooMany,
            maxRounds: 3,
            convergenceThreshold: 1.0,
            userPrompt: 'test',
            synthesizerStrategy: 'round-robin',
          })
      ).toThrow('Council allows maximum 12 members');
    });

    it('should throw if maxRounds < 1', () => {
      expect(
        () =>
          new CouncilEngine({
            members: ['a', 'b', 'c'],
            maxRounds: 0,
            convergenceThreshold: 1.0,
            userPrompt: 'test',
            synthesizerStrategy: 'round-robin',
          })
      ).toThrow('Max rounds must be between 1 and 3');
    });

    it('should throw if maxRounds > 3', () => {
      expect(
        () =>
          new CouncilEngine({
            members: ['a', 'b', 'c'],
            maxRounds: 4,
            convergenceThreshold: 1.0,
            userPrompt: 'test',
            synthesizerStrategy: 'round-robin',
          })
      ).toThrow('Max rounds must be between 1 and 3');
    });

    it('should accept valid configuration', () => {
      expect(
        () =>
          new CouncilEngine({
            members: ['anthropic/claude-opus-4-6', 'openai/gpt-5-2', 'google/gemini-3-pro-preview'],
            maxRounds: 3,
            convergenceThreshold: 1.0,
            userPrompt: 'What is the meaning of life?',
            synthesizerStrategy: 'round-robin',
          })
      ).not.toThrow();
    });

    it('should accept 12 members', () => {
      const members = Array.from({ length: 12 }, (_, i) => `model-${i}`);
      expect(
        () =>
          new CouncilEngine({
            members,
            maxRounds: 3,
            convergenceThreshold: 1.0,
            userPrompt: 'test',
            synthesizerStrategy: 'round-robin',
          })
      ).not.toThrow();
    });
  });

  describe('deliberation phases', () => {
    it('should emit phase events in correct order', async () => {
      const engine = new CouncilEngine(
        {
          members: [
            'anthropic/claude-opus-4-6',
            'openai/gpt-5-2',
            'google/gemini-3-pro-preview',
          ],
          maxRounds: 1,
          convergenceThreshold: 1.0,
          userPrompt: 'Hello world',
          synthesizerStrategy: 'round-robin',
        },
        { openrouter: 'sk-or-test' }
      );

      const events: CouncilStreamEvent[] = [];
      for await (const event of engine.deliberate()) {
        events.push(event);
      }

      // Must have phases in order
      const phaseEvents = events.filter(
        (e) => e.type === 'phase'
      ) as Array<{ type: 'phase'; phase: string; round?: number }>;

      expect(phaseEvents.length).toBeGreaterThanOrEqual(4);
      expect(phaseEvents[0].phase).toBe('acquaintance');
      expect(phaseEvents[1].phase).toBe('draft');
      expect(phaseEvents[2].phase).toBe('critique');
      expect(phaseEvents[3].phase).toBe('synthesis');
    });

    it('should emit member_response events for each model', async () => {
      const members = [
        'anthropic/claude-opus-4-6',
        'openai/gpt-5-2',
        'google/gemini-3-pro-preview',
      ];

      const engine = new CouncilEngine(
        {
          members,
          maxRounds: 1,
          convergenceThreshold: 1.0,
          userPrompt: 'Hello',
          synthesizerStrategy: 'round-robin',
        },
        { openrouter: 'sk-or-test' }
      );

      const events: CouncilStreamEvent[] = [];
      for await (const event of engine.deliberate()) {
        events.push(event);
      }

      const memberResponses = events.filter((e) => e.type === 'member_response');
      // At minimum: 3 acquaintance + 3 draft + 3 critique = 9
      expect(memberResponses.length).toBeGreaterThanOrEqual(9);
    });

    it('should emit a final response (converged or max_rounds)', async () => {
      const engine = new CouncilEngine(
        {
          members: [
            'anthropic/claude-opus-4-6',
            'openai/gpt-5-2',
            'google/gemini-3-pro-preview',
          ],
          maxRounds: 1,
          convergenceThreshold: 1.0,
          userPrompt: 'Hello',
          synthesizerStrategy: 'round-robin',
        },
        { openrouter: 'sk-or-test' }
      );

      const events: CouncilStreamEvent[] = [];
      for await (const event of engine.deliberate()) {
        events.push(event);
      }

      const lastEvent = events[events.length - 1];
      expect(
        lastEvent.type === 'converged' || lastEvent.type === 'max_rounds'
      ).toBe(true);
    });

    it('should emit stats before the final event', async () => {
      const engine = new CouncilEngine(
        {
          members: [
            'anthropic/claude-opus-4-6',
            'openai/gpt-5-2',
            'google/gemini-3-pro-preview',
          ],
          maxRounds: 1,
          convergenceThreshold: 1.0,
          userPrompt: 'Hello',
          synthesizerStrategy: 'round-robin',
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

  describe('synthesizer strategy', () => {
    it('round-robin should rotate synthesizer each round', () => {
      const engine = new CouncilEngine(
        {
          members: ['model-a', 'model-b', 'model-c'],
          maxRounds: 3,
          convergenceThreshold: 1.0,
          userPrompt: 'test',
          synthesizerStrategy: 'round-robin',
        }
      );
      // Access private method via casting for testing
      const getSynthesizer = (engine as any).getSynthesizerForRound.bind(engine);
      expect(getSynthesizer(1)).toBe('model-a');
      expect(getSynthesizer(2)).toBe('model-b');
      expect(getSynthesizer(3)).toBe('model-c');
      expect(getSynthesizer(4)).toBe('model-a'); // wraps around
    });

    it('fixed should always use first member', () => {
      const engine = new CouncilEngine(
        {
          members: ['model-a', 'model-b', 'model-c'],
          maxRounds: 3,
          convergenceThreshold: 1.0,
          userPrompt: 'test',
          synthesizerStrategy: 'fixed',
        }
      );
      const getSynthesizer = (engine as any).getSynthesizerForRound.bind(engine);
      expect(getSynthesizer(1)).toBe('model-a');
      expect(getSynthesizer(2)).toBe('model-a');
      expect(getSynthesizer(3)).toBe('model-a');
    });
  });
});
