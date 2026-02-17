import { describe, it, expect } from 'vitest';
import { CouncilEngine } from '@/lib/llm/council';
import type { CouncilStreamEvent } from '@/types/council';

describe('Council Full Flow Integration', () => {
  it('should complete a full 3-member, 1-round council deliberation', async () => {
    const engine = new CouncilEngine(
      {
        members: [
          'anthropic/claude-opus-4-6',
          'openai/gpt-5-2',
          'google/gemini-3-pro-preview',
        ],
        maxRounds: 1,
        convergenceThreshold: 1.0,
        userPrompt: 'Explain quantum computing in simple terms',
        synthesizerStrategy: 'round-robin',
      },
      { openrouter: 'sk-or-test' }
    );

    const events: CouncilStreamEvent[] = [];
    let finalResponse = '';
    let totalTokens = 0;

    for await (const event of engine.deliberate()) {
      events.push(event);

      if (event.type === 'converged' || event.type === 'max_rounds') {
        finalResponse = event.response;
      }
      if (event.type === 'stats') {
        totalTokens = event.tokens;
      }
    }

    // Verify the flow completed
    expect(events.length).toBeGreaterThan(0);
    expect(finalResponse.length).toBeGreaterThan(0);
    expect(totalTokens).toBeGreaterThan(0);

    // Verify all phases were hit
    const phases = events
      .filter((e): e is { type: 'phase'; phase: string } => e.type === 'phase')
      .map((e) => e.phase);

    expect(phases).toContain('acquaintance');
    expect(phases).toContain('draft');
    expect(phases).toContain('critique');
    expect(phases).toContain('synthesis');
    expect(phases).toContain('approval');
  }, 30000);

  it('should track member statistics', async () => {
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

    const result = await engine.run();

    expect(result.totalTokens).toBeGreaterThan(0);
    expect(result.totalLatencyMs).toBeGreaterThan(0);
    expect(result.finalResponse.length).toBeGreaterThan(0);
    expect(Object.keys(result.memberStats).length).toBe(3);
  }, 30000);

  it('should handle different synthesizer strategies', async () => {
    for (const strategy of ['round-robin', 'fixed', 'voted'] as const) {
      const engine = new CouncilEngine(
        {
          members: ['model-a', 'model-b', 'model-c'],
          maxRounds: 2,
          convergenceThreshold: 1.0,
          userPrompt: 'Test',
          synthesizerStrategy: strategy,
        },
        { openrouter: 'sk-or-test' }
      );

      // Just verify it doesn't throw
      const events: CouncilStreamEvent[] = [];
      for await (const event of engine.deliberate()) {
        events.push(event);
      }
      expect(events.length).toBeGreaterThan(0);
    }
  }, 60000);
});
