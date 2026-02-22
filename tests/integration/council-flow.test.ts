import { describe, it, expect } from 'vitest';
import { CouncilEngine } from '@/lib/llm/council';
import type { CouncilStreamEvent } from '@/types/council';

describe('Council Full Flow Integration', () => {
  it('should complete a full 3-member council deliberation', async () => {
    const engine = new CouncilEngine(
      {
        members: [
          'anthropic/claude-opus-4-6',
          'openai/gpt-5-2',
          'google/gemini-3-pro-preview',
        ],
        contextBudget: 16384,
        userPrompt: 'Explain quantum computing in simple terms',
      },
      { openrouter: 'sk-or-test' }
    );

    const events: CouncilStreamEvent[] = [];
    let finalResponse = '';
    let totalTokens = 0;

    for await (const event of engine.deliberate()) {
      events.push(event);

      if (event.type === 'final_answer') {
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

    // Verify budget events were emitted
    const budgetEvents = events.filter((e) => e.type === 'budget');
    expect(budgetEvents.length).toBeGreaterThan(0);

    // Verify turn events for each model
    const turnStarts = events.filter((e) => e.type === 'turn_start');
    expect(turnStarts.length).toBeGreaterThanOrEqual(3);
  }, 30000);

  it('should track member statistics', async () => {
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

    const result = await engine.run();

    expect(result.totalTokens).toBeGreaterThan(0);
    expect(result.totalLatencyMs).toBeGreaterThan(0);
    expect(result.finalResponse.length).toBeGreaterThan(0);
    expect(Object.keys(result.memberStats).length).toBe(3);
  }, 30000);

  it('should handle different budget sizes', async () => {
    for (const budget of [8192, 16384, 32768]) {
      const engine = new CouncilEngine(
        {
          members: ['model-a', 'model-b', 'model-c'],
          contextBudget: budget,
          userPrompt: 'Test',
        },
        { openrouter: 'sk-or-test' }
      );

      const events: CouncilStreamEvent[] = [];
      for await (const event of engine.deliberate()) {
        events.push(event);
      }
      expect(events.length).toBeGreaterThan(0);
    }
  }, 60000);
});
